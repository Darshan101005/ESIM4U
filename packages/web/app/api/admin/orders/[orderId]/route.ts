import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, getAdminCookieName } from "@/lib/admin-auth";
import pool from "@/lib/db";
import { fetchConsumption } from "@/lib/montyesim";

function getAdmin(request: NextRequest) {
  const token = request.cookies.get(getAdminCookieName())?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

export async function GET(request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    if (!getAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await pool.query(`SELECT * FROM orders WHERE id = $1`, [params.orderId]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = result.rows[0];

    let consumption = null;
    if (order.monty_order_id) {
      try {
        consumption = await fetchConsumption(order.monty_order_id, order.order_reference);
      } catch {}
    }

    return NextResponse.json({ order, consumption });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
