import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, getAdminCookieName } from "@/lib/admin-auth";
import pool from "@/lib/db";
import { expireStalePendingOrders, purgeExpiredTrash } from "@/lib/order-lifecycle";

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

    // Keep things tidy: expire abandoned attempts and purge trash past its TTL.
    await expireStalePendingOrders();
    await purgeExpiredTrash();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status") || undefined;
    const search = (searchParams.get("q") || "").trim();
    const trash = searchParams.get("deleted") === "1";
    const offset = (page - 1) * limit;

    // Recycle bin shows soft-deleted rows; the main list hides them.
    const deletedClause = trash ? `o.deleted_scope IS NOT NULL` : `o.deleted_scope IS NULL`;
    // Pull the customer's name from the auth "user" table (LEFT JOIN so orders
    // from since-deleted accounts still appear).
    const cols = trash
      ? `o.id, o.user_email, u.name AS customer_name, o.bundle_name, o.country, o.price, o.currency, o.display_currency, o.display_rate, o.order_reference, o.status, o.deleted_scope, o.deleted_at, o.deleted_by, o.created_at`
      : `o.id, o.user_email, u.name AS customer_name, o.bundle_code, o.bundle_name, o.country, o.data_amount, o.validity, o.price, o.currency, o.order_reference, o.monty_order_id, o.iccid, o.status, o.created_at`;

    const baseFrom = `FROM orders o LEFT JOIN "user" u ON u.id = o.user_id WHERE ${deletedClause}`;
    let query = `SELECT ${cols} ${baseFrom}`;
    let countQuery = `SELECT COUNT(*) as total ${baseFrom}`;
    const params: (string | number)[] = [];
    const countParams: (string | number)[] = [];

    if (status && !trash) {
      params.push(status);
      countParams.push(status);
      query += ` AND o.status = $${params.length}`;
      countQuery += ` AND o.status = $${countParams.length}`;
    }

    // Free-text search across name, email, country and plan (bundle/data).
    // Spaces are stripped on both sides so "1gb" matches "1 GB" and
    // "unitedstates" matches "United States".
    if (search) {
      const norm = `%${search.toLowerCase().replace(/\s+/g, "")}%`;
      params.push(norm);
      countParams.push(norm);
      const matchCond = (i: number) =>
        `(REPLACE(LOWER(COALESCE(u.name,'')),' ','') LIKE $${i}
          OR REPLACE(LOWER(COALESCE(o.user_email,'')),' ','') LIKE $${i}
          OR REPLACE(LOWER(COALESCE(o.country,'')),' ','') LIKE $${i}
          OR REPLACE(LOWER(COALESCE(o.bundle_name,'')),' ','') LIKE $${i}
          OR REPLACE(LOWER(COALESCE(o.data_amount,'')),' ','') LIKE $${i})`;
      query += ` AND ${matchCond(params.length)}`;
      countQuery += ` AND ${matchCond(countParams.length)}`;
    }

    query += ` ORDER BY o.${trash ? "deleted_at" : "created_at"} DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
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
