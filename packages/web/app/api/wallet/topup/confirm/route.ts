import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import pool from "@/lib/db";
import { stripe, STRIPE_ENABLED, extractPaymentDetails } from "@/lib/stripe";
import { PAYPAL_ENABLED, getPaypalOrder, capturePaypalOrder } from "@/lib/paypal";
import { completeTopup, completePaypalTopup } from "@/lib/wallet-topup";
import { getWalletBalanceUsd } from "@/lib/wallet";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const paypalOrderId = (body.order_id || "").trim();

    // PayPal top-up return flow.
    if (paypalOrderId) {
      if (!PAYPAL_ENABLED) {
        return NextResponse.json({ error: "PayPal is not configured" }, { status: 503 });
      }
      // Must belong to this user's pending top-up.
      const owns = await pool.query(
        `SELECT 1 FROM wallet_topups WHERE paypal_order_id = $1 AND user_id = $2 LIMIT 1`,
        [paypalOrderId, session.user.id]
      );
      if (owns.rows.length === 0) {
        return NextResponse.json({ error: "This top-up does not belong to your account" }, { status: 403 });
      }

      const info = await getPaypalOrder(paypalOrderId);
      if (info.status === "APPROVED") {
        const { status, details } = await capturePaypalOrder(paypalOrderId);
        if (status !== "COMPLETED") {
          return NextResponse.json({ error: "Payment could not be completed", status }, { status: 402 });
        }
        await completePaypalTopup(paypalOrderId, details);
      } else if (info.status === "COMPLETED") {
        await completePaypalTopup(paypalOrderId, {
          orderId: paypalOrderId,
          captureId: null,
          payerEmail: info.payerEmail,
          capturedValue: info.amount,
          capturedCurrency: info.currency,
        });
      } else {
        return NextResponse.json({ error: "Payment not approved yet", status: info.status }, { status: 402 });
      }

      const balanceUsd = await getWalletBalanceUsd(session.user.id);
      return NextResponse.json({ balanceUsd });
    }

    // Stripe top-up return flow.
    if (!STRIPE_ENABLED) {
      return NextResponse.json({ error: "Payment is not configured" }, { status: 503 });
    }
    const sessionId = (body.session_id || "").trim();
    if (!sessionId) {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
    }

    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent", "payment_intent.latest_charge"],
    });

    if (checkoutSession.metadata?.purpose !== "wallet_topup") {
      return NextResponse.json({ error: "This session is not a wallet top-up" }, { status: 400 });
    }
    if (checkoutSession.metadata?.userId !== session.user.id) {
      return NextResponse.json({ error: "This payment does not belong to your account" }, { status: 403 });
    }
    if (checkoutSession.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed", status: checkoutSession.payment_status }, { status: 402 });
    }

    const payment = extractPaymentDetails(checkoutSession);
    await completeTopup(sessionId, payment);
    const balanceUsd = await getWalletBalanceUsd(session.user.id);

    return NextResponse.json({ balanceUsd });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to confirm top-up";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
