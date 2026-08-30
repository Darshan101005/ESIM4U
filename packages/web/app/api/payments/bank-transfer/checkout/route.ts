import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import pool from "@/lib/db";
import { validatePromoCode } from "@/lib/promo";
import { validateAffiliateCode } from "@/lib/affiliate";
import { getFxRates, convertFromUsd } from "@/lib/fx";
import { ensureOrderPaymentColumns, generateOrderReference } from "@/lib/orders-schema";
import { CLOUDINARY_ENABLED, uploadPaymentProofs } from "@/lib/cloudinary";
import { BANK_DETAILS, createBankTransfer, generateBankRef } from "@/lib/bank-transfer";
import { expireStalePendingOrders, getActivePendingOrder } from "@/lib/order-lifecycle";

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

const MAX_PROOFS = 3;
const ALLOWED_MIME = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

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

/** Rejects anything that isn't a JPEG/PNG/WebP data URI. */
function isAllowedImageDataUri(uri: string): boolean {
  const match = /^data:([^;,]+)[;,]/.exec(uri || "");
  if (!match) return false;
  return ALLOWED_MIME.includes(match[1].toLowerCase());
}

export async function POST(request: NextRequest) {
  try {
    if (!CLOUDINARY_ENABLED) {
      return NextResponse.json({ error: "Proof upload is not configured" }, { status: 503 });
    }

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
    const txnReference = (body.txn_reference || "").trim() || null;
    const amountPaid = (body.amount_paid || "").toString().trim() || null;
    const senderName = (body.sender_name || "").trim() || null;
    const paymentDate = (body.payment_date || "").trim() || null;
    const note = (body.note || "").trim() || null;
    const proofs: string[] = Array.isArray(body.proofs) ? body.proofs : [];

    // Screenshot(s) are mandatory; 1..3 images; images only.
    if (proofs.length === 0) {
      return NextResponse.json({ error: "Please upload at least one payment screenshot" }, { status: 400 });
    }
    if (proofs.length > MAX_PROOFS) {
      return NextResponse.json({ error: `You can upload up to ${MAX_PROOFS} screenshots` }, { status: 400 });
    }
    if (!proofs.every(isAllowedImageDataUri)) {
      return NextResponse.json({ error: "Only JPG, PNG or WebP images are allowed" }, { status: 400 });
    }

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

    // The Monzo account settles in GBP, so the customer is asked to pay in GBP.
    const payCurrency = BANK_DETAILS.payCurrency; // "GBP"
    let displayRate = 1;
    let displayAmount = finalUsd;
    try {
      const fx = await getFxRates();
      displayRate = fx.rates[payCurrency] ?? 1;
      displayAmount = convertFromUsd(finalUsd, payCurrency, fx);
    } catch {
      return NextResponse.json({ error: "Pricing is temporarily unavailable. Please try again shortly." }, { status: 503 });
    }

    // Upload the screenshots to Cloudinary before creating anything.
    let proofUrls: string[];
    try {
      const uploaded = await uploadPaymentProofs(proofs);
      proofUrls = uploaded.map((u) => u.url);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      return NextResponse.json({ error: `Could not upload your screenshot: ${msg}` }, { status: 502 });
    }

    await ensureOrderPaymentColumns();
    const reference = generateBankRef();

    // Record the submission (proof + entered details) for admin review.
    await createBankTransfer({
      reference,
      userId,
      userEmail,
      customerName,
      amountUsd: finalUsd,
      displayCurrency: payCurrency,
      displayAmount,
      displayRate,
      txnReference,
      amountPaid,
      senderName,
      paymentDate,
      note,
      proofUrls,
    });

    // Create the order rows (one per cart item) as awaiting verification.
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
           discount_amount, promo_code, affiliate_code, status, payment_source, bank_transfer_reference, payment_method_type,
           topup_of_order_id, previous_order_reference, previous_monty_order_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)`,
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
          payCurrency,
          displayRate,
          itemDiscount,
          promoCode,
          affiliateCode,
          "pending_verification",
          "bank_transfer",
          reference,
          "bank_transfer",
          item.topup_of_order_id,
          item.previous_order_reference,
          item.previous_monty_order_id,
        ]
      );
    }

    // Clear the cart — the submission is recorded and awaiting verification.
    await pool.query(`DELETE FROM cart_items WHERE user_id = $1`, [userId]);

    return NextResponse.json({ reference, status: "pending_verification" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to submit bank transfer";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
