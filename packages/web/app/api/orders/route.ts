import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import pool from "@/lib/db";
import { ensureOrderPaymentColumns } from "@/lib/orders-schema";

async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureOrderPaymentColumns();

    const result = await pool.query(
      `SELECT id, bundle_code, bundle_name, country, country_code, data_amount, validity, price, currency, order_reference, monty_order_id, iccid, qr_code_url, lpa_code, smdp_address, matching_id, bundle_expiry_date, display_currency, display_rate, discount_amount, promo_code, affiliate_code, status, stripe_session_id, stripe_payment_intent, stripe_charge_id, card_brand, card_last4, card_wallet, payment_method_type, receipt_url, refund_id, refund_status, created_at FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
      [session.user.id]
    );

    return NextResponse.json({ orders: result.rows });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch orders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
