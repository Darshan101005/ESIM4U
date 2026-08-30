import pool from "@/lib/db";
import { ensureOrderPaymentColumns } from "@/lib/orders-schema";
import { refundReferralForOrders } from "@/lib/referral";

/**
 * How long a card/PayPal checkout may sit unpaid before we treat it as
 * abandoned. Kept short enough to free the customer to try again, long enough
 * that a genuinely slow payment isn't killed mid-flight.
 */
export const PENDING_TTL_MINUTES = 30;

/**
 * Marks abandoned card/PayPal `pending` orders as `failed` once they pass the
 * TTL. "Sweep on read" pattern — cheap, indexed UPDATE we run before listing
 * orders or starting a new checkout, so no background cron is required.
 * Wallet is synchronous (never lingers) and bank transfers use
 * `pending_verification` (admin-driven, not time-limited), so both are excluded.
 */
export async function expireStalePendingOrders(): Promise<number> {
  await ensureOrderPaymentColumns();
  const res = await pool.query(
    `UPDATE orders
       SET status = 'failed',
           status_reason = 'Payment was not completed in time'
     WHERE status = 'pending'
       AND COALESCE(payment_source, 'stripe') IN ('stripe', 'paypal')
       AND created_at < now() - ($1 || ' minutes')::interval
     RETURNING id, stripe_session_id, paypal_order_id`,
    [String(PENDING_TTL_MINUTES)]
  );

  // Return any referral credit that was redeemed on the sessions we just expired.
  const expired = res.rows as { id: number; stripe_session_id: string | null; paypal_order_id: string | null }[];
  const stripeRefs = [...new Set(expired.map((r) => r.stripe_session_id).filter(Boolean))] as string[];
  const paypalRefs = [...new Set(expired.map((r) => r.paypal_order_id).filter(Boolean))] as string[];
  for (const ref of stripeRefs) {
    await refundReferralForOrders("stripe_session_id", ref).catch((e) =>
      console.error("Referral refund failed on expire (stripe):", e instanceof Error ? e.message : e)
    );
  }
  for (const ref of paypalRefs) {
    await refundReferralForOrders("paypal_order_id", ref).catch((e) =>
      console.error("Referral refund failed on expire (paypal):", e instanceof Error ? e.message : e)
    );
  }

  return res.rowCount ?? 0;
}

/** How long soft-deleted orders stay in the recycle bin before being purged. */
export const TRASH_TTL_DAYS = 30;

/**
 * Permanently deletes orders that have been in the recycle bin longer than the
 * TTL. Same "sweep on read" approach — run before showing the recycle bin.
 */
export async function purgeExpiredTrash(): Promise<number> {
  await ensureOrderPaymentColumns();
  const res = await pool.query(
    `DELETE FROM orders
      WHERE deleted_scope IS NOT NULL
        AND deleted_at IS NOT NULL
        AND deleted_at < now() - ($1 || ' days')::interval
      RETURNING id`,
    [String(TRASH_TTL_DAYS)]
  );
  return res.rowCount ?? 0;
}

export interface ActivePendingOrder {
  id: number;
  order_reference: string;
  payment_source: string | null;
}

/**
 * Returns the customer's current in-flight card/PayPal payment, if any. Used to
 * stop a customer from stacking up multiple simultaneous checkouts — one must
 * resolve (succeed, fail, expire, or be cancelled) before another can start.
 */
export async function getActivePendingOrder(userId: string): Promise<ActivePendingOrder | null> {
  const res = await pool.query(
    `SELECT id, order_reference, payment_source
       FROM orders
      WHERE user_id = $1
        AND status = 'pending'
        AND COALESCE(payment_source, 'stripe') IN ('stripe', 'paypal')
      ORDER BY created_at DESC
      LIMIT 1`,
    [userId]
  );
  return (res.rows[0] as ActivePendingOrder) || null;
}
