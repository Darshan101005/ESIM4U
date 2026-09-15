import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyAdminToken, getAdminCookieName } from "@/lib/admin-auth";
import { ensureWalletSchema, getWalletBalanceUsd, debitWallet } from "@/lib/wallet";

function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(getAdminCookieName())?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

const MANUAL_STATUSES = new Set(["failed", "cancelled", "refunded"]);

/**
 * Admin lifecycle actions on a single wallet top-up (mirrors the order admin
 * controls): manually mark a status, soft-delete to the recycle bin (for the
 * admin only, or everywhere so it also leaves the customer's view), restore, or
 * purge permanently. Marking a previously-credited top-up as "refunded" also
 * debits the wallet (clamped to the available balance) so the balance stays
 * accurate after an external Stripe/bank refund.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = parseInt(params.id, 10);
  if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    await ensureWalletSchema();
    const body = await request.json().catch(() => ({}));
    const action = String(body.action || "");

    const cur = await pool.query(`SELECT * FROM wallet_topups WHERE id = $1`, [id]);
    if (cur.rows.length === 0) return NextResponse.json({ error: "Top-up not found" }, { status: 404 });
    const row = cur.rows[0];

    if (action === "mark") {
      const status = String(body.status || "");
      if (!MANUAL_STATUSES.has(status)) {
        return NextResponse.json({ error: "Status must be failed, cancelled or refunded" }, { status: 400 });
      }

      // Enforce valid transitions. A pending (in-flight) top-up can be marked
      // failed/cancelled; a completed (money captured) top-up can ONLY be
      // refunded — you can't "fail" money that was actually taken.
      const from = row.status as string;
      const allowed =
        (from === "pending" && (status === "failed" || status === "cancelled")) ||
        (from === "completed" && status === "refunded");
      if (!allowed) {
        return NextResponse.json(
          { error: `A ${from} top-up can't be marked ${status}.` },
          { status: 400 }
        );
      }

      // Refunding a completed top-up returns money to the customer externally —
      // pull the credited amount back out of the wallet so the balance is right.
      if (status === "refunded" && row.status === "completed") {
        const balance = await getWalletBalanceUsd(row.user_id);
        const amt = Math.min(Number(row.amount_usd), balance);
        if (amt > 0) {
          const rate = Number(row.display_rate) || 1;
          try {
            await debitWallet({
              userId: row.user_id,
              amountUsd: amt,
              reason: "admin_debit",
              reference: row.provider === "paypal" ? row.paypal_order_id : row.stripe_session_id,
              description: "Top-up refunded (external)",
              displayCurrency: row.display_currency,
              displayAmount: Math.round(amt * rate * 100) / 100,
              displayRate: rate,
              createdBy: admin.email || String(admin.id),
            });
          } catch {
            // Don't mark the row refunded if we couldn't pull the money back —
            // otherwise the balance is overstated on a terminal row that can't retry.
            return NextResponse.json(
              { error: "Couldn't adjust the wallet balance for this refund. Please try again." },
              { status: 500 }
            );
          }
        }
      }

      await pool.query(`UPDATE wallet_topups SET status = $1 WHERE id = $2`, [status, id]);
      return NextResponse.json({ ok: true, status });
    }

    if (action === "soft_delete") {
      const scope = body.scope === "all" ? "all" : "admin";
      await pool.query(
        `UPDATE wallet_topups SET deleted_scope = $1, deleted_at = now(), deleted_by = $2 WHERE id = $3`,
        [scope, admin.email || String(admin.id), id]
      );
      return NextResponse.json({ ok: true, deleted_scope: scope });
    }

    if (action === "restore") {
      await pool.query(
        `UPDATE wallet_topups SET deleted_scope = NULL, deleted_at = NULL, deleted_by = NULL WHERE id = $1`,
        [id]
      );
      return NextResponse.json({ ok: true, restored: true });
    }

    if (action === "purge") {
      await pool.query(`DELETE FROM wallet_topups WHERE id = $1 AND deleted_scope IS NOT NULL`, [id]);
      return NextResponse.json({ ok: true, purged: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Action failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
