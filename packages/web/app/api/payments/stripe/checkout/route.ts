import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import pool from "@/lib/db";
import { stripe, STRIPE_ENABLED, resolveChargeCurrency } from "@/lib/stripe";
import { validatePromoCode } from "@/lib/promo";
import { validateAffiliateCode } from "@/lib/affiliate";
import { getFxRates, convertFromUsd, SupportedCurrency, SUPPORTED_CURRENCIES } from "@/lib/fx";
import { ensureOrderPaymentColumns, generateOrderReference } from "@/lib/orders-schema";
import { expireStalePendingOrders, getActivePendingOrder } from "@/lib/order-lifecycle";
import {
  getReferralBalanceUsd,
  computeRedeemableUsd,
  debitReferral,
  REFERRAL_MIN_PURCHASE_USD,
} from "@/lib/referral";
import { recordActivity } from "@/lib/activity";

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

const CHARGE_TO_FX: Record<string, "USD" | "EUR" | "GBP"> = { usd: "USD", eur: "EUR", gbp: "GBP" };

/** Blocks a new checkout if the customer already has a live payment in progress. */
async function guardActivePending(userId: string) {
  await expireStalePendingOrders();
  const active = await getActivePendingOrder(userId);
  if (active) {
    return NextResponse.json(
      {
        error: "You already have a payment in progress. Please complete or cancel it before starting a new order.",
        code: "PENDING_EXISTS",
        orderId: active.id,
      },
      { status: 409 }
    );
  }
  return null;
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
    if (!STRIPE_ENABLED) {
      return NextResponse.json({ error: "Payment is not configured" }, { status: 503 });
    }

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const userEmail = session.user.email as string;
    const customerName = (session.user.name as string) || "Customer";

    const blocked = await guardActivePending(userId);
    if (blocked) return blocked;

    const body = await request.json().catch(() => ({}));
    const code = (body.code || "").trim();
    const applyReferralCredit = body.apply_referral_credit === true;
    const displayCurrencyRaw = body.display_currency || "USD";
    const displayCurrency: SupportedCurrency = SUPPORTED_CURRENCIES.includes(displayCurrencyRaw as SupportedCurrency)
      ? (displayCurrencyRaw as SupportedCurrency)
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
    if (finalUsd < 0.5) {
      return NextResponse.json({ error: "Order total is too low for card payment" }, { status: 400 });
    }

    // Resolve redeemable referral credit. Only when opted-in and the cart meets
    // the minimum. Leave at least $0.50 to charge (Stripe minimum).
    let referralUsd = 0;
    if (applyReferralCredit && subtotalUsd + 1e-9 >= REFERRAL_MIN_PURCHASE_USD) {
      const balanceUsd = await getReferralBalanceUsd(userId);
      referralUsd = computeRedeemableUsd(subtotalUsd, balanceUsd, round(finalUsd - 0.5));
    }
    const chargeableUsd = round(Math.max(0, finalUsd - referralUsd));

    const chargeCurrency = resolveChargeCurrency(displayCurrency);
    let chargeAmount = chargeableUsd;
    let displayRate = 1;
    try {
      const fx = await getFxRates();
      displayRate = fx.rates[displayCurrency] ?? 1;
      if (chargeCurrency !== "usd") {
        chargeAmount = convertFromUsd(chargeableUsd, CHARGE_TO_FX[chargeCurrency], fx);
      }
    } catch {
      if (chargeCurrency !== "usd") {
        return NextResponse.json({ error: "Pricing is temporarily unavailable. Please try again shortly." }, { status: 503 });
      }
    }

    const unitAmount = Math.round(chargeAmount * 100);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    let productName: string;
    if (items.length === 1) {
      const it = items[0];
      const base = it.bundle_name || it.country || "eSIM Plan";
      const details = [it.data_amount, it.validity].filter(Boolean).join(" · ");
      productName = details ? `${base} (${details})` : base;
    } else {
      productName = `eSIM4U — ${items.length} eSIM plans`;
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: userEmail,
      client_reference_id: userId,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: chargeCurrency,
            unit_amount: unitAmount,
            product_data: { name: productName },
          },
        },
      ],
      metadata: { userId, code: code || "", displayCurrency },
      success_url: `${appUrl}/dashboard/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard/cart`,
    });

    // Create the pending order rows (one per cart item) tied to this session.
    // Cart is intentionally NOT cleared — fulfilment clears it on success, and an
    // abandoned/expired session leaves the cart intact so the customer can retry.
    await ensureOrderPaymentColumns();

    // Debit the referral ledger now (order creation). The refund path keys off
    // the referral_credit_used stored on the order rows.
    if (referralUsd > 0) {
      try {
        await debitReferral({
          userId,
          amountUsd: referralUsd,
          reason: "redeemed",
          reference: checkoutSession.id,
          description: "Referral credit applied at checkout",
        });
      } catch {
        return NextResponse.json({ error: "Referral credit is no longer available" }, { status: 409 });
      }
    }

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
      // Store the full redeemed amount on the first row only, to avoid double refunds.
      const rowReferralUsed = i === 0 ? referralUsd : 0;

      await pool.query(
        `INSERT INTO orders (user_id, user_email, customer_name, bundle_code, bundle_name, country, country_code,
           data_amount, validity, price, currency, order_reference, cost_price, display_currency, display_rate,
           discount_amount, promo_code, affiliate_code, status, stripe_session_id,
           topup_of_order_id, previous_order_reference, previous_monty_order_id, referral_credit_used)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)`,
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
          checkoutSession.id,
          item.topup_of_order_id,
          item.previous_order_reference,
          item.previous_monty_order_id,
          rowReferralUsed,
        ]
      );
    }

    // Audit the purchase (IP/device/geo) without blocking the checkout redirect.
    recordActivity({ req: request, userId, email: userEmail, eventType: "purchase" }).catch(() => {});

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to start checkout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
