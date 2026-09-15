import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import pool from "@/lib/db";
import { ensureWalletSchema } from "@/lib/wallet";
import { expireStalePendingTopups } from "@/lib/wallet-topup";

// The current user's wallet top-ups, shaped to slot into the Transactions feed
// alongside orders. Money entering the wallet is itself a transaction, so it
// belongs on the Transactions page with its own payment details.
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureWalletSchema();
    // Flip abandoned pending top-ups to failed (same 30-min rule as orders).
    await expireStalePendingTopups();
    const r = await pool.query(
      `SELECT id, provider, amount_usd, display_currency, display_amount, display_rate, status,
              stripe_session_id, stripe_payment_intent, paypal_order_id, paypal_capture_id, receipt_url, created_at
       FROM wallet_topups WHERE user_id = $1 AND deleted_scope IS DISTINCT FROM 'all' ORDER BY created_at DESC`,
      [session.user.id]
    );

    const topups = r.rows.map((t) => ({
      id: t.id,
      kind: "topup" as const,
      bundle_name: "Wallet top-up",
      price: String(t.amount_usd),
      display_currency: t.display_currency,
      display_rate: t.display_rate != null ? String(t.display_rate) : "1",
      status: t.status, // pending | completed | failed | cancelled | refunded
      provider: t.provider,
      payment_method_type: t.provider,
      stripe_session_id: t.stripe_session_id,
      stripe_payment_intent: t.stripe_payment_intent,
      paypal_order_id: t.paypal_order_id,
      paypal_capture_id: t.paypal_capture_id,
      receipt_url: t.receipt_url,
      created_at: t.created_at,
    }));

    return NextResponse.json({ topups });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load top-ups";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
