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
