import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import pool from "@/lib/db";
import { fetchConsumption } from "@/lib/montyesim";
import { expireStalePendingOrders } from "@/lib/order-lifecycle";
import { isRetryable } from "@/lib/order-status";

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session;
}

export async function GET(_request: Request, { params }: { params: { orderId: string } }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Keep this order's status honest (abandoned attempts flip to failed).
    await expireStalePendingOrders();

    const result = await pool.query(`SELECT * FROM orders WHERE id = $1 AND user_id = $2`, [params.orderId, session.user.id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = result.rows[0];

    // Orders removed "everywhere" must not be visible to the customer.
    if (order.deleted_scope === "all") {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

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

/**
 * Customer actions on their own order:
 *  - "cancel": cancels a still-pending payment so they're free to start again.
 *  - "retry": for a non-delivered order, re-adds the plan to the cart (and
 *    cancels it if it was still pending) so the customer can pay again.
 */
export async function POST(request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const action = String(body.action || "");

    const res = await pool.query(`SELECT * FROM orders WHERE id = $1 AND user_id = $2`, [params.orderId, session.user.id]);
    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    const order = res.rows[0];

    if (action === "cancel") {
      if (order.status !== "pending") {
        return NextResponse.json({ error: "Only a pending payment can be cancelled" }, { status: 400 });
      }
      await pool.query(
        `UPDATE orders SET status = 'cancelled', status_reason = 'Cancelled by customer' WHERE id = $1 AND user_id = $2`,
        [order.id, session.user.id]
      );
      return NextResponse.json({ status: "cancelled" });
    }

    if (action === "retry") {
      if (!isRetryable(order.status)) {
        return NextResponse.json({ error: "This order can't be retried" }, { status: 400 });
      }
      // Free the payment lock if it was still pending.
      if (order.status === "pending") {
        await pool.query(
          `UPDATE orders SET status = 'cancelled', status_reason = 'Replaced by a new attempt' WHERE id = $1 AND user_id = $2`,
          [order.id, session.user.id]
        );
      }
      // Ensure the plan is in the cart so they land on checkout ready to pay.
      const inCart = await pool.query(`SELECT id FROM cart_items WHERE user_id = $1 AND bundle_code = $2`, [
        session.user.id,
        order.bundle_code,
      ]);
      if (inCart.rows.length === 0) {
        await pool.query(
          `INSERT INTO cart_items (user_id, bundle_code, bundle_name, country, country_code, data_amount, validity, price, cost_price, currency)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [
            session.user.id,
            order.bundle_code,
            order.bundle_name,
            order.country,
            order.country_code,
            order.data_amount,
            order.validity,
            order.price,
            order.cost_price ?? null,
            "USD",
          ]
        );
      }
      return NextResponse.json({ redirect: "/dashboard/checkout" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
