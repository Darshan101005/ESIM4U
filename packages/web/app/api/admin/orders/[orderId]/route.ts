import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, getAdminCookieName } from "@/lib/admin-auth";
import pool from "@/lib/db";
import { fetchConsumption } from "@/lib/montyesim";
import { expireStalePendingOrders } from "@/lib/order-lifecycle";
import { provisionOrderById } from "@/lib/fulfillment";

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

    await expireStalePendingOrders();

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

const MANUAL_STATUSES = new Set(["completed", "failed", "cancelled"]);

/**
 * Admin order controls:
 *  - "set_status": manually set completed / failed / cancelled (e.g. free a
 *    stuck payment so the customer can retry, or record a manual resolution).
 *  - "retry_provisioning": re-attempt the MontyeSIM assignment for a paid order.
 */
export async function POST(request: NextRequest, { params }: { params: { orderId: string } }) {
  const admin = getAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json().catch(() => ({}));
    const action = String(body.action || "");
    const reviewedBy = admin.email || String(admin.id);

    const existing = await pool.query(`SELECT id FROM orders WHERE id = $1`, [params.orderId]);
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (action === "set_status") {
      const status = String(body.status || "");
      const note = (body.note || "").trim() || null;
      if (!MANUAL_STATUSES.has(status)) {
        return NextResponse.json({ error: "Status must be completed, failed or cancelled" }, { status: 400 });
      }
      await pool.query(
        `UPDATE orders SET status = $1, status_reason = $2, admin_updated_by = $3, admin_updated_at = now() WHERE id = $4`,
        [status, note, reviewedBy, params.orderId]
      );
      const updated = await pool.query(`SELECT * FROM orders WHERE id = $1`, [params.orderId]);
      return NextResponse.json({ order: updated.rows[0] });
    }

    if (action === "retry_provisioning") {
      const order = await provisionOrderById(Number(params.orderId));
      await pool.query(`UPDATE orders SET admin_updated_by = $1, admin_updated_at = now() WHERE id = $2`, [
        reviewedBy,
        params.orderId,
      ]);
      return NextResponse.json({ order });
    }

    // Move to recycle bin. scope 'admin' hides from the admin panel only;
    // scope 'all' also hides it from the customer.
    if (action === "soft_delete") {
      const scope = body.scope === "all" ? "all" : "admin";
      await pool.query(
        `UPDATE orders SET deleted_scope = $1, deleted_at = now(), deleted_by = $2 WHERE id = $3`,
        [scope, reviewedBy, params.orderId]
      );
      return NextResponse.json({ deleted_scope: scope });
    }

    // Bring an order back from the recycle bin.
    if (action === "restore") {
      await pool.query(
        `UPDATE orders SET deleted_scope = NULL, deleted_at = NULL, deleted_by = NULL WHERE id = $1`,
        [params.orderId]
      );
      return NextResponse.json({ restored: true });
    }

    // Permanently remove (only allowed from the recycle bin).
    if (action === "purge") {
      await pool.query(`DELETE FROM orders WHERE id = $1 AND deleted_scope IS NOT NULL`, [params.orderId]);
      return NextResponse.json({ purged: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
