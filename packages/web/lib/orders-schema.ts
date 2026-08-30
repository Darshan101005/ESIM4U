import pool from "@/lib/db";

let ensured = false;

/**
 * Ensures the payment / fulfilment columns exist on the orders table.
 * Idempotent and cached per process — safe to call on every request.
 */
export async function ensureOrderPaymentColumns(): Promise<void> {
  if (ensured) return;
  await pool.query(`
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_intent TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_charge_id TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS card_brand VARCHAR(30);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS card_last4 VARCHAR(4);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS card_wallet VARCHAR(30);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method_type VARCHAR(30);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS receipt_url TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_id TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_status VARCHAR(20);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_source VARCHAR(20) DEFAULT 'stripe';
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS wallet_reference TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS bank_transfer_reference TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS paypal_order_id TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS paypal_capture_id TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS status_reason TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_updated_by TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_updated_at TIMESTAMPTZ;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS deleted_scope VARCHAR(10);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS deleted_by TEXT;
  `);
  ensured = true;
}

export function generateOrderReference(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ESIM4U-${timestamp}-${random}`;
}
