import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import pool from "@/lib/db";
import { validatePromoCode } from "@/lib/promo";
import { validateAffiliateCode } from "@/lib/affiliate";
import { getFxRates, SupportedCurrency, SUPPORTED_CURRENCIES } from "@/lib/fx";
import { ensureOrderPaymentColumns, generateOrderReference } from "@/lib/orders-schema";
import { getWalletBalanceUsd, debitWallet, WalletError } from "@/lib/wallet";
import { fulfillWalletSession } from "@/lib/fulfillment";
import { expireStalePendingOrders, getActivePendingOrder } from "@/lib/order-lifecycle";
import {
  getReferralBalanceUsd,
  computeRedeemableUsd,
  debitReferral,
  creditReferral,
  REFERRAL_MIN_PURCHASE_USD,
} from "@/lib/referral";
import { recordActivity } from "@/lib/activity";

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

interface CartRow {
  bundle_code: string;
  bundle_name: string | null;
  country: string | null;
  country_code: string | null;
  data_amount: string | null;
  validity: string | null;
  price: string;
  cost_price: string | null;
  topup_of_order_id: number | null;
  previous_order_reference: string | null;
  previous_monty_order_id: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const userEmail = session.user.email as string;
    const customerName = (session.user.name as string) || "Customer";

    // One live payment at a time: expire stale attempts, then block if one is active.
    await expireStalePendingOrders();
    const activePending = await getActivePendingOrder(userId);
    if (activePending) {
      return NextResponse.json(
        {
          error: "You already have a payment in progress. Please complete or cancel it before starting a new order.",
          code: "PENDING_EXISTS",
          orderId: activePending.id,
        },
        { status: 409 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const code = (body.code || "").trim();
    const applyReferralCredit = body.apply_referral_credit === true;
    const rawCurrency = body.display_currency || "USD";
    const displayCurrency: SupportedCurrency = SUPPORTED_CURRENCIES.includes(rawCurrency as SupportedCurrency)
      ? (rawCurrency as SupportedCurrency)
      : "USD";

    const cartRes = await pool.query(
      `SELECT bundle_code, bundle_name, country, country_code, data_amount, validity, price, cost_price,
              topup_of_order_id, previous_order_reference, previous_monty_order_id
       FROM cart_items WHERE user_id = $1 ORDER BY added_at ASC`,
      [userId]
    );
    const items = cartRes.rows as CartRow[];
    if (items.length === 0) {
      return NextResponse.json({ error: "Your cart is empty" }, { status: 400 });
    }

    const subtotalUsd = round(items.reduce((sum, i) => sum + Number(i.price), 0));

    // Resolve promo / affiliate discount.
    let discountUsd = 0;
    let promoCode: string | null = null;
    let affiliateCode: string | null = null;
    if (code) {
      const promo = await validatePromoCode(code, subtotalUsd);
      if (promo.valid) {
        discountUsd = promo.discountAmount;
        promoCode = promo.code || code;
      } else {
        const aff = await validateAffiliateCode(code, subtotalUsd);
        if (aff.valid) {
          discountUsd = aff.discountAmount;
          affiliateCode = aff.code || code;
        }
      }
    }

    const finalUsd = round(Math.max(0, subtotalUsd - discountUsd));

    // Resolve redeemable referral credit — reduces what the wallet is charged.
    let referralUsd = 0;
    if (applyReferralCredit && subtotalUsd + 1e-9 >= REFERRAL_MIN_PURCHASE_USD) {
      const referralBalanceUsd = await getReferralBalanceUsd(userId);
      referralUsd = computeRedeemableUsd(subtotalUsd, referralBalanceUsd, finalUsd);
    }
    const chargeableUsd = round(Math.max(0, finalUsd - referralUsd));

    // Confirm the wallet can cover the remaining amount before creating anything.
    const balanceUsd = await getWalletBalanceUsd(userId);
    if (chargeableUsd > balanceUsd + 1e-9) {
      return NextResponse.json(
        { error: "Insufficient wallet balance", code: "INSUFFICIENT_FUNDS", balanceUsd, requiredUsd: chargeableUsd },
        { status: 400 }
      );
    }

    // Lock the display rate so the wallet history shows a stable figure.
    let displayRate = 1;
    try {
      const fx = await getFxRates();
      displayRate = fx.rates[displayCurrency] ?? 1;
    } catch {
      if (displayCurrency !== "USD") {
        return NextResponse.json({ error: "Pricing is temporarily unavailable. Please try again shortly." }, { status: 503 });
      }
    }

    await ensureOrderPaymentColumns();
    const walletReference = `WLT-${generateOrderReference()}`;

    // Debit the referral ledger now (order creation). Refunded on cancel/expire
    // via the referral_credit_used stored on the order rows.
    if (referralUsd > 0) {
      try {
        await debitReferral({
          userId,
          amountUsd: referralUsd,
          reason: "redeemed",
          reference: walletReference,
          description: "Referral credit applied at checkout",
        });
      } catch {
        return NextResponse.json({ error: "Referral credit is no longer available" }, { status: 409 });
      }
    }

    // Create the pending order rows (one per cart item) tied to this wallet ref.
    let allocatedDiscount = 0;
    let allocatedReferral = 0;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemPrice = Number(item.price);

      let itemDiscount: number;
      let itemReferral: number;
      if (i === items.length - 1) {
        itemDiscount = round(discountUsd - allocatedDiscount);
        itemReferral = round(referralUsd - allocatedReferral);
      } else {
        itemDiscount = subtotalUsd > 0 ? round(discountUsd * (itemPrice / subtotalUsd)) : 0;
        allocatedDiscount = round(allocatedDiscount + itemDiscount);
        itemReferral = subtotalUsd > 0 ? round(referralUsd * (itemPrice / subtotalUsd)) : 0;
        allocatedReferral = round(allocatedReferral + itemReferral);
      }
      const finalPrice = round(Math.max(0, itemPrice - itemDiscount - itemReferral));
      const rowReferralUsed = i === 0 ? referralUsd : 0;

      await pool.query(
        `INSERT INTO orders (user_id, user_email, customer_name, bundle_code, bundle_name, country, country_code,
           data_amount, validity, price, currency, order_reference, cost_price, display_currency, display_rate,
           discount_amount, promo_code, affiliate_code, status, payment_source, wallet_reference, payment_method_type,
           topup_of_order_id, previous_order_reference, previous_monty_order_id, referral_credit_used)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26)`,
        [
          userId,
          userEmail,
          customerName,
          item.bundle_code,
          item.bundle_name,
          item.country,
          item.country_code,
          item.data_amount,
          item.validity,
          finalPrice,
          "USD",
          generateOrderReference(),
          item.cost_price,
          displayCurrency,
          displayRate,
          itemDiscount,
          promoCode,
          affiliateCode,
          "pending",
          "wallet",
          walletReference,
          "wallet",
          item.topup_of_order_id,
          item.previous_order_reference,
          item.previous_monty_order_id,
          rowReferralUsed,
        ]
      );
    }

    // Reserve the funds up front. Failed items get credited back during fulfilment.
    if (chargeableUsd > 0) {
      try {
        await debitWallet({
          userId,
          amountUsd: chargeableUsd,
          reason: "purchase",
          reference: walletReference,
          description: items.length === 1 ? `Purchase — ${items[0].bundle_name || items[0].country || "eSIM"}` : `Purchase — ${items.length} eSIM plans`,
          displayCurrency,
          displayAmount: round(chargeableUsd * displayRate),
          displayRate,
        });
      } catch (err) {
        // Roll back the orders we just created if the balance slipped away in a race.
        await pool.query(`DELETE FROM orders WHERE wallet_reference = $1 AND status = 'pending'`, [walletReference]);
        // Return the referral credit we debited above.
        if (referralUsd > 0) {
          await creditReferral({
            userId,
            amountUsd: referralUsd,
            reason: "refund",
            reference: walletReference,
            description: "Referral credit returned — payment could not be completed",
          }).catch(() => {});
        }
        if (err instanceof WalletError && err.code === "INSUFFICIENT_FUNDS") {
          return NextResponse.json(
            { error: "Insufficient wallet balance", code: "INSUFFICIENT_FUNDS", balanceUsd, requiredUsd: chargeableUsd },
            { status: 400 }
          );
        }
        throw err;
      }
    }

    recordActivity({ req: request, userId, email: userEmail, eventType: "purchase" }).catch(() => {});

    const orders = await fulfillWalletSession(walletReference);
    return NextResponse.json({ orders });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to complete wallet payment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
