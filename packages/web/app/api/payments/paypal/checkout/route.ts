import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import pool from "@/lib/db";
import { validatePromoCode } from "@/lib/promo";
import { validateAffiliateCode } from "@/lib/affiliate";
import { getFxRates, convertFromUsd, SupportedCurrency, SUPPORTED_CURRENCIES } from "@/lib/fx";
import { ensureOrderPaymentColumns, generateOrderReference } from "@/lib/orders-schema";
import { PAYPAL_ENABLED, createPaypalOrder } from "@/lib/paypal";

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
}

export async function POST(request: NextRequest) {
  try {
    if (!PAYPAL_ENABLED) {
      return NextResponse.json({ error: "PayPal is not configured" }, { status: 503 });
    }

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const userEmail = session.user.email as string;
    const customerName = (session.user.name as string) || "Customer";

    const body = await request.json().catch(() => ({}));
    const code = (body.code || "").trim();
    const rawCurrency = body.display_currency || "USD";
    const displayCurrency: SupportedCurrency = SUPPORTED_CURRENCIES.includes(rawCurrency as SupportedCurrency)
      ? (rawCurrency as SupportedCurrency)
      : "USD";

    const cartRes = await pool.query(
      `SELECT bundle_code, bundle_name, country, country_code, data_amount, validity, price, cost_price
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
    if (finalUsd <= 0) {
      return NextResponse.json({ error: "Order total must be greater than zero for PayPal" }, { status: 400 });
    }

    // Charge in the customer's selected currency (same as Stripe).
    let displayRate = 1;
    let chargeAmount = finalUsd;
    try {
      const fx = await getFxRates();
      displayRate = fx.rates[displayCurrency] ?? 1;
      chargeAmount = convertFromUsd(finalUsd, displayCurrency, fx);
    } catch {
      if (displayCurrency !== "USD") {
        return NextResponse.json({ error: "Pricing is temporarily unavailable. Please try again shortly." }, { status: 503 });
      }
    }

    await ensureOrderPaymentColumns();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const description = items.length === 1 ? items[0].bundle_name || items[0].country || "eSIM plan" : `${items.length} eSIM plans`;

    // Create the PayPal order first so we can key our order rows on its id.
    const paypalOrder = await createPaypalOrder({
      amount: chargeAmount.toFixed(2),
      currency: displayCurrency,
      reference: generateOrderReference(),
      description,
      returnUrl: `${appUrl}/dashboard/checkout/paypal/success`,
      cancelUrl: `${appUrl}/dashboard/checkout`,
    });

    // Create pending order rows (one per cart item) linked to the PayPal order.
    let allocatedDiscount = 0;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemPrice = Number(item.price);

      let itemDiscount: number;
      if (i === items.length - 1) {
        itemDiscount = round(discountUsd - allocatedDiscount);
      } else {
        itemDiscount = subtotalUsd > 0 ? round(discountUsd * (itemPrice / subtotalUsd)) : 0;
        allocatedDiscount = round(allocatedDiscount + itemDiscount);
      }
      const finalPrice = round(Math.max(0, itemPrice - itemDiscount));

      await pool.query(
        `INSERT INTO orders (user_id, user_email, customer_name, bundle_code, bundle_name, country, country_code,
           data_amount, validity, price, currency, order_reference, cost_price, display_currency, display_rate,
           discount_amount, promo_code, affiliate_code, status, payment_source, paypal_order_id, payment_method_type)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)`,
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
          "paypal",
          paypalOrder.id,
          "paypal",
        ]
      );
    }

    return NextResponse.json({ url: paypalOrder.approveUrl, orderId: paypalOrder.id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to start PayPal checkout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
