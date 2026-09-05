import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, getAdminCookieName } from "@/lib/admin-auth";
import { ensureAffiliateExtras, generateAffiliateToken } from "@/lib/affiliate";
import pool from "@/lib/db";

function getAdmin(request: NextRequest) {
  const token = request.cookies.get(getAdminCookieName())?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

function parseBody(body: Record<string, unknown>) {
  const code = String(body.code || "").trim();
  const name = String(body.name || "").trim();
  const email = body.email ? String(body.email).trim() : null;
  const platform = body.platform ? String(body.platform) : null;
  const contact = body.contact ? String(body.contact) : null;
  const commissionRate = Number(body.commission_rate);
  const discountType = body.customer_discount_type === "fixed" ? "fixed" : "percent";
  const discountValue = body.customer_discount_value == null || body.customer_discount_value === "" ? 0 : Number(body.customer_discount_value);
  const isActive = body.is_active !== false;
  return { code, name, email, platform, contact, commissionRate, discountType, discountValue, isActive };
}

export async function GET(request: NextRequest) {
  if (!getAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await ensureAffiliateExtras();
    const result = await pool.query(
      `SELECT a.*,
        COALESCE(s.sales_count, 0) AS sales_count,
        COALESCE(s.total_sales, 0) AS total_sales,
        COALESCE(s.total_commission, 0) AS total_commission,
        COALESCE(p.total_paid, 0) AS total_paid,
        COALESCE(p.total_pending, 0) AS total_pending,
        (COALESCE(s.total_commission, 0) - COALESCE(p.total_paid, 0)) AS balance_owed
       FROM affiliates a
       LEFT JOIN (
         SELECT affiliate_id, COUNT(*) AS sales_count, SUM(sale_amount) AS total_sales, SUM(commission_amount) AS total_commission
         FROM affiliate_sales GROUP BY affiliate_id
       ) s ON s.affiliate_id = a.id
       LEFT JOIN (
         SELECT affiliate_id,
           SUM(amount) FILTER (WHERE status = 'completed') AS total_paid,
           SUM(amount) FILTER (WHERE status = 'pending') AS total_pending
         FROM affiliate_payouts GROUP BY affiliate_id
       ) p ON p.affiliate_id = a.id
       ORDER BY a.created_at DESC`
    );
    return NextResponse.json({ affiliates: result.rows });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load affiliates";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!getAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await ensureAffiliateExtras();
    const a = parseBody(await request.json());
    if (!a.code || !a.name) return NextResponse.json({ error: "Code and name are required" }, { status: 400 });
    if (Number.isNaN(a.commissionRate) || a.commissionRate < 0) {
      return NextResponse.json({ error: "Invalid commission rate" }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO affiliates (code, name, email, platform, contact, commission_rate, customer_discount_type, customer_discount_value, is_active, access_token)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [a.code, a.name, a.email, a.platform, a.contact, a.commissionRate, a.discountType, a.discountValue, a.isActive, generateAffiliateToken()]
    );
    return NextResponse.json({ affiliate: result.rows[0] }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create affiliate";
    if (message.includes("duplicate")) return NextResponse.json({ error: "Code already exists" }, { status: 409 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!getAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const id = parseInt(String(body.id));
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    const a = parseBody(body);

    await ensureAffiliateExtras();
    const result = await pool.query(
      `UPDATE affiliates SET code = $1, name = $2, email = $3, platform = $4, contact = $5, commission_rate = $6,
       customer_discount_type = $7, customer_discount_value = $8, is_active = $9 WHERE id = $10 RETURNING *`,
      [a.code, a.name, a.email, a.platform, a.contact, a.commissionRate, a.discountType, a.discountValue, a.isActive, id]
    );
    if (result.rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ affiliate: result.rows[0] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update affiliate";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!getAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    await pool.query(`DELETE FROM affiliates WHERE id = $1`, [id]);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete affiliate";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
