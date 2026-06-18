import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, getAdminCookieName } from "@/lib/admin-auth";
import pool from "@/lib/db";

function getAdmin(request: NextRequest) {
  const token = request.cookies.get(getAdminCookieName())?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

export async function GET(request: NextRequest) {
  try {
    const admin = getAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status") || undefined;
    const offset = (page - 1) * limit;

    let query = `SELECT id, user_email, bundle_code, bundle_name, country, data_amount, validity, price, currency, order_reference, monty_order_id, iccid, status, created_at FROM orders`;
    let countQuery = `SELECT COUNT(*) as total FROM orders`;
    const params: (string | number)[] = [];
    const countParams: string[] = [];

    if (status) {
      query += ` WHERE status = $1`;
      countQuery += ` WHERE status = $1`;
      params.push(status);
      countParams.push(status);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const [ordersResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, countParams),
    ]);

    return NextResponse.json({
      orders: ordersResult.rows,
      total: parseInt(countResult.rows[0].total),
      page,
      limit,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch orders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
