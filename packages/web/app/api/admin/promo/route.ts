import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, getAdminCookieName } from "@/lib/admin-auth";
import pool from "@/lib/db";

function getAdmin(request: NextRequest) {
  const token = request.cookies.get(getAdminCookieName())?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

function parseBody(body: Record<string, unknown>) {
  const code = String(body.code || "").trim();
  const discountType = body.discount_type === "fixed" ? "fixed" : "percent";
  const discountValue = Number(body.discount_value);
  const maxDiscount = body.max_discount === "" || body.max_discount == null ? null : Number(body.max_discount);
  const usageLimit = body.usage_limit === "" || body.usage_limit == null ? null : parseInt(String(body.usage_limit));
  const expiryDate = body.expiry_date ? String(body.expiry_date) : null;
  const isActive = body.is_active !== false;
  const description = body.description ? String(body.description) : null;
  return { code, discountType, discountValue, maxDiscount, usageLimit, expiryDate, isActive, description };
}

export async function GET(request: NextRequest) {
  if (!getAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const result = await pool.query(`SELECT * FROM promo_codes ORDER BY created_at DESC`);
    return NextResponse.json({ promos: result.rows });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load promo codes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!getAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const p = parseBody(await request.json());
    if (!p.code) return NextResponse.json({ error: "Code is required" }, { status: 400 });
    if (Number.isNaN(p.discountValue) || p.discountValue <= 0) {
      return NextResponse.json({ error: "Invalid discount value" }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO promo_codes (code, description, discount_type, discount_value, max_discount, usage_limit, expiry_date, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [p.code, p.description, p.discountType, p.discountValue, p.maxDiscount, p.usageLimit, p.expiryDate, p.isActive]
    );
    return NextResponse.json({ promo: result.rows[0] }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create promo code";
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
    const p = parseBody(body);

    const result = await pool.query(
      `UPDATE promo_codes SET code = $1, description = $2, discount_type = $3, discount_value = $4,
       max_discount = $5, usage_limit = $6, expiry_date = $7, is_active = $8 WHERE id = $9 RETURNING *`,
      [p.code, p.description, p.discountType, p.discountValue, p.maxDiscount, p.usageLimit, p.expiryDate, p.isActive, id]
    );
    if (result.rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ promo: result.rows[0] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update promo code";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!getAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    await pool.query(`DELETE FROM promo_codes WHERE id = $1`, [id]);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete promo code";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
