import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import pool from "@/lib/db";
import { ensureOrderPaymentColumns } from "@/lib/orders-schema";

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session;
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await pool.query(
      `SELECT id, bundle_code, bundle_name, country, country_code, data_amount, validity, price, cost_price, currency, topup_of_order_id, previous_order_reference, added_at FROM cart_items WHERE user_id = $1 ORDER BY added_at DESC`,
      [session.user.id]
    );

    return NextResponse.json({ items: result.rows });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch cart";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      bundle_code,
      bundle_name,
      country,
      country_code,
      data_amount,
      validity,
      price,
      cost_price,
      currency,
      topup_of_order_id,
      previous_order_reference,
      previous_monty_order_id,
    } = body;

    if (!bundle_code || !price) {
      return NextResponse.json({ error: "bundle_code and price are required" }, { status: 400 });
    }

    await ensureOrderPaymentColumns();

    const isTopup = Boolean(topup_of_order_id && previous_order_reference && previous_monty_order_id);

    // A normal purchase de-dupes by bundle. A top-up is tied to a specific eSIM,
    // so it's only a duplicate if the same top-up (same target eSIM) is queued.
    const existing = isTopup
      ? await pool.query(`SELECT id FROM cart_items WHERE user_id = $1 AND bundle_code = $2 AND topup_of_order_id = $3`, [
          session.user.id,
          bundle_code,
          topup_of_order_id,
        ])
      : await pool.query(`SELECT id FROM cart_items WHERE user_id = $1 AND bundle_code = $2 AND topup_of_order_id IS NULL`, [
          session.user.id,
          bundle_code,
        ]);

    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "Item already in cart" }, { status: 409 });
    }

    const result = await pool.query(
      `INSERT INTO cart_items (user_id, bundle_code, bundle_name, country, country_code, data_amount, validity, price, cost_price, currency, topup_of_order_id, previous_order_reference, previous_monty_order_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [
        session.user.id,
        bundle_code,
        bundle_name || null,
        country || null,
        country_code || null,
        data_amount || null,
        validity || null,
        price,
        cost_price ?? null,
        currency || "USD",
        isTopup ? topup_of_order_id : null,
        isTopup ? previous_order_reference : null,
        isTopup ? previous_monty_order_id : null,
      ]
    );

    return NextResponse.json({ item: result.rows[0] }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to add to cart";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("id");
    const clearAll = searchParams.get("clear_all");

    if (clearAll === "true") {
      await pool.query(`DELETE FROM cart_items WHERE user_id = $1`, [session.user.id]);
      return NextResponse.json({ success: true });
    }

    if (!itemId) {
      return NextResponse.json({ error: "Item id is required" }, { status: 400 });
    }

    await pool.query(
      `DELETE FROM cart_items WHERE id = $1 AND user_id = $2`,
      [itemId, session.user.id]
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete cart item";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
