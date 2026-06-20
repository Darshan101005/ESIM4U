import pool from "@/lib/db";

export type DiscountType = "percent" | "fixed";

export interface PromoCode {
  id: number;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  max_discount: number | null;
  usage_limit: number | null;
  used_count: number;
  expiry_date: string | null;
  is_active: boolean;
  created_at: string;
}

export interface DiscountResult {
  valid: boolean;
  reason?: string;
  code?: string;
  discountAmount: number;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export function computeDiscount(
  subtotal: number,
  discountType: DiscountType,
  discountValue: number,
  maxDiscount: number | null
): number {
  let discount = discountType === "percent" ? subtotal * (discountValue / 100) : discountValue;
  if (maxDiscount != null && discount > maxDiscount) discount = maxDiscount;
  if (discount > subtotal) discount = subtotal;
  if (discount < 0) discount = 0;
  return round(discount);
}

export async function validatePromoCode(code: string, subtotalUsd: number): Promise<DiscountResult> {
  const trimmed = (code || "").trim();
  if (!trimmed) return { valid: false, reason: "No code provided", discountAmount: 0 };

  const result = await pool.query(
    `SELECT * FROM promo_codes WHERE LOWER(code) = LOWER($1)`,
    [trimmed]
  );

  if (result.rows.length === 0) {
    return { valid: false, reason: "Invalid promo code", discountAmount: 0 };
  }

  const promo = result.rows[0] as PromoCode;

  if (!promo.is_active) {
    return { valid: false, reason: "This code is no longer active", discountAmount: 0 };
  }

  if (promo.expiry_date && new Date(promo.expiry_date).getTime() < Date.now()) {
    return { valid: false, reason: "This code has expired", discountAmount: 0 };
  }

  if (promo.usage_limit != null && promo.used_count >= promo.usage_limit) {
    return { valid: false, reason: "This code has reached its usage limit", discountAmount: 0 };
  }

  const discountAmount = computeDiscount(
    subtotalUsd,
    promo.discount_type,
    Number(promo.discount_value),
    promo.max_discount != null ? Number(promo.max_discount) : null
  );

  return { valid: true, code: promo.code, discountAmount };
}

export async function incrementPromoUsage(code: string): Promise<void> {
  await pool.query(`UPDATE promo_codes SET used_count = used_count + 1 WHERE LOWER(code) = LOWER($1)`, [code]);
}
