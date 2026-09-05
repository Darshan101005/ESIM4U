import crypto from "crypto";
import pool from "@/lib/db";
import { DiscountType, computeDiscount } from "@/lib/promo";

export interface Affiliate {
  id: number;
  code: string;
  name: string;
  platform: string | null;
  contact: string | null;
  commission_rate: number;
  customer_discount_type: DiscountType;
  customer_discount_value: number;
  is_active: boolean;
  created_at: string;
}

export interface AffiliateResult {
  valid: boolean;
  reason?: string;
  affiliateId?: number;
  code?: string;
  discountAmount: number;
  commissionRate: number;
}

export async function validateAffiliateCode(code: string, subtotalUsd: number): Promise<AffiliateResult> {
  const trimmed = (code || "").trim();
  if (!trimmed) return { valid: false, reason: "No code provided", discountAmount: 0, commissionRate: 0 };

  const result = await pool.query(`SELECT * FROM affiliates WHERE LOWER(code) = LOWER($1)`, [trimmed]);

  if (result.rows.length === 0) {
    return { valid: false, reason: "Invalid affiliate code", discountAmount: 0, commissionRate: 0 };
  }

  const affiliate = result.rows[0] as Affiliate;

  if (!affiliate.is_active) {
    return { valid: false, reason: "This affiliate code is not active", discountAmount: 0, commissionRate: 0 };
  }

  const discountAmount = computeDiscount(
    subtotalUsd,
    affiliate.customer_discount_type,
    Number(affiliate.customer_discount_value),
    null
  );

  return {
    valid: true,
    affiliateId: affiliate.id,
    code: affiliate.code,
    discountAmount,
    commissionRate: Number(affiliate.commission_rate),
  };
}

export async function recordAffiliateSale(params: {
  affiliateId: number;
  affiliateCode: string;
  orderId: number;
  orderReference: string;
  saleAmount: number;
  commissionRate: number;
}): Promise<void> {
  const commissionAmount = Math.round(params.saleAmount * (params.commissionRate / 100) * 100) / 100;
  await pool.query(
    `INSERT INTO affiliate_sales (affiliate_id, affiliate_code, order_id, order_reference, sale_amount, commission_amount)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [params.affiliateId, params.affiliateCode, params.orderId, params.orderReference, params.saleAmount, commissionAmount]
  );
}

/* ------------------------------------------------------------------ */
/* Affiliate extras: email, public access token, and manual payouts    */
/* ------------------------------------------------------------------ */

let extrasReady = false;

export function generateAffiliateToken(): string {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Adds the columns/tables the affiliate program needs on top of the base
 * schema: an email, a public read-only access token, and a payouts ledger.
 * Idempotent + cached per process.
 */
export async function ensureAffiliateExtras(): Promise<void> {
  if (extrasReady) return;
  await pool.query(`
    ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS email VARCHAR(255);
    ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS access_token VARCHAR(64);

    CREATE TABLE IF NOT EXISTS affiliate_payouts (
      id SERIAL PRIMARY KEY,
      affiliate_id INTEGER NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
      amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      status VARCHAR(12) NOT NULL DEFAULT 'pending',  -- pending | completed
      method VARCHAR(50),
      note TEXT,
      paid_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_affiliate ON affiliate_payouts(affiliate_id, created_at DESC);
  `);

  // Backfill access tokens for any affiliates created before this column existed.
  const missing = await pool.query(`SELECT id FROM affiliates WHERE access_token IS NULL`);
  for (const row of missing.rows as { id: number }[]) {
    await pool.query(`UPDATE affiliates SET access_token = $1 WHERE id = $2`, [generateAffiliateToken(), row.id]);
  }
  await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_affiliates_access_token ON affiliates(access_token)`);

  extrasReady = true;
}

export interface AffiliateStats {
  salesCount: number;
  totalSales: number;
  totalCommission: number;
  totalPaid: number;       // completed payouts
  pendingPayouts: number;  // payouts marked pending
  balanceOwed: number;     // commission earned minus completed payouts
}

function round2(v: number): number {
  return Math.round(Number(v) * 100) / 100;
}

export async function getAffiliateStats(affiliateId: number): Promise<AffiliateStats> {
  await ensureAffiliateExtras();
  const sales = await pool.query(
    `SELECT COUNT(*)::int AS c, COALESCE(SUM(sale_amount),0) AS sales, COALESCE(SUM(commission_amount),0) AS commission
     FROM affiliate_sales WHERE affiliate_id = $1`,
    [affiliateId]
  );
  const payouts = await pool.query(
    `SELECT
       COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) AS paid,
       COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) AS pending
     FROM affiliate_payouts WHERE affiliate_id = $1`,
    [affiliateId]
  );
  const totalCommission = round2(Number(sales.rows[0].commission));
  const totalPaid = round2(Number(payouts.rows[0].paid));
  return {
    salesCount: Number(sales.rows[0].c),
    totalSales: round2(Number(sales.rows[0].sales)),
    totalCommission,
    totalPaid,
    pendingPayouts: round2(Number(payouts.rows[0].pending)),
    balanceOwed: round2(totalCommission - totalPaid),
  };
}

export interface AffiliatePayout {
  id: number;
  amount: string;
  status: "pending" | "completed";
  method: string | null;
  note: string | null;
  paid_at: string | null;
  created_at: string;
}

export async function listPayouts(affiliateId: number): Promise<AffiliatePayout[]> {
  await ensureAffiliateExtras();
  const r = await pool.query(
    `SELECT id, amount, status, method, note, paid_at, created_at
     FROM affiliate_payouts WHERE affiliate_id = $1 ORDER BY created_at DESC`,
    [affiliateId]
  );
  return r.rows as AffiliatePayout[];
}

export async function createPayout(p: {
  affiliateId: number;
  amount: number;
  status: "pending" | "completed";
  method?: string | null;
  note?: string | null;
}): Promise<AffiliatePayout> {
  await ensureAffiliateExtras();
  const paidAt = p.status === "completed" ? new Date() : null;
  const r = await pool.query(
    `INSERT INTO affiliate_payouts (affiliate_id, amount, status, method, note, paid_at)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, amount, status, method, note, paid_at, created_at`,
    [p.affiliateId, round2(p.amount), p.status, p.method ?? null, p.note ?? null, paidAt]
  );
  return r.rows[0] as AffiliatePayout;
}

export async function updatePayoutStatus(id: number, status: "pending" | "completed"): Promise<void> {
  await ensureAffiliateExtras();
  const paidAt = status === "completed" ? new Date() : null;
  await pool.query(`UPDATE affiliate_payouts SET status = $1, paid_at = $2 WHERE id = $3`, [status, paidAt, id]);
}

export async function deletePayout(id: number): Promise<void> {
  await ensureAffiliateExtras();
  await pool.query(`DELETE FROM affiliate_payouts WHERE id = $1`, [id]);
}

/** Public read-only view of an affiliate, resolved by their access token. */
export async function getAffiliateByToken(token: string) {
  await ensureAffiliateExtras();
  const clean = (token || "").trim();
  if (!clean) return null;
  const r = await pool.query(`SELECT * FROM affiliates WHERE access_token = $1`, [clean]);
  if (r.rows.length === 0) return null;
  const affiliate = r.rows[0] as Affiliate & { email?: string; access_token?: string };
  const stats = await getAffiliateStats(affiliate.id);
  const payouts = await listPayouts(affiliate.id);
  const recentSales = await pool.query(
    `SELECT order_reference, sale_amount, commission_amount, created_at
     FROM affiliate_sales WHERE affiliate_id = $1 ORDER BY created_at DESC LIMIT 25`,
    [affiliate.id]
  );
  return {
    name: affiliate.name,
    code: affiliate.code,
    commissionRate: Number(affiliate.commission_rate),
    isActive: affiliate.is_active,
    stats,
    payouts,
    recentSales: recentSales.rows,
  };
}
