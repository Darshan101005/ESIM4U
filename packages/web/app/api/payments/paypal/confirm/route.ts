import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import pool from "@/lib/db";
import { PAYPAL_ENABLED, getPaypalOrder, capturePaypalOrder } from "@/lib/paypal";
import { fulfillPaypalSession } from "@/lib/fulfillment";

export async function POST(request: NextRequest) {
  try {
    if (!PAYPAL_ENABLED) {
      return NextResponse.json({ error: "PayPal is not configured" }, { status: 503 });
    }

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const orderId = (body.order_id || "").trim();
    if (!orderId) {
      return NextResponse.json({ error: "Missing order id" }, { status: 400 });
    }

    // The PayPal order must belong to this user's pending order rows.
    const owns = await pool.query(
      `SELECT 1 FROM orders WHERE paypal_order_id = $1 AND user_id = $2 LIMIT 1`,
      [orderId, session.user.id]
    );
    if (owns.rows.length === 0) {
      return NextResponse.json({ error: "This payment does not belong to your account" }, { status: 403 });
    }

    // Check the current state. If already captured, fulfil idempotently.
    const info = await getPaypalOrder(orderId);
    if (info.status === "COMPLETED") {
      const orders = await fulfillPaypalSession(orderId, {
        orderId,
        captureId: null,
        payerEmail: info.payerEmail,
        capturedValue: info.amount,
        capturedCurrency: info.currency,
      });
      return NextResponse.json({ orders });
    }

    if (info.status !== "APPROVED") {
      return NextResponse.json({ error: "Payment not approved yet", status: info.status }, { status: 402 });
    }

    const { status, details } = await capturePaypalOrder(orderId);
    if (status !== "COMPLETED") {
      return NextResponse.json({ error: "Payment could not be completed", status }, { status: 402 });
    }

    const orders = await fulfillPaypalSession(orderId, details);
    return NextResponse.json({ orders });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to confirm PayPal payment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
