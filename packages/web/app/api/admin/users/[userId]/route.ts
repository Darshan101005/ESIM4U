import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, getAdminCookieName } from "@/lib/admin-auth";
import pool from "@/lib/db";
import { pruneActivityLogIfDue } from "@/lib/activity";
import { ensureUserAdminColumns } from "@/lib/user-admin-schema";
import { getWalletBalanceUsd } from "@/lib/wallet";
import { getReferralSummary } from "@/lib/referral";

function getAdmin(request: NextRequest) {
  const token = request.cookies.get(getAdminCookieName())?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

/**
 * Full CRM profile for one customer: identity + block status, personal details,
 * latest session (device/IP/geo), wallet, referral, orders and lifetime stats.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const admin = getAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { userId } = await params;

    await ensureUserAdminColumns();
    pruneActivityLogIfDue().catch(() => {});

    const userRes = await pool.query(
      `SELECT id, name, email, "emailVerified", "createdAt", COALESCE(banned, false) AS banned, "banReason"
       FROM "user" WHERE id = $1`,
      [userId]
    );
    const user = userRes.rows[0] || null;
    if (!user) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    const profileRes = await pool.query(
      `SELECT phone, country, preferred_currency, date_of_birth, gender, last_seen_at FROM user_profiles WHERE user_id = $1`,
      [userId]
    );
    const profile = profileRes.rows[0] || {};

    const activityRes = await pool.query(
      `SELECT ipv4, ipv6, continent, country, country_code, region, city, latitude, longitude, postal,
              flag_emoji, isp, org, timezone_id, is_vpn, is_proxy, is_tor, is_mobile,
              user_agent, event_type, created_at
       FROM activity_log WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    const ordersRes = await pool
      .query(
        `SELECT id, order_reference, bundle_name, country, data_amount, validity, price, status, created_at
         FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 15`,
        [userId]
      )
      .catch(() => ({ rows: [] }));

    const statsRes = await pool
      .query(
        `SELECT COUNT(*)::int AS total,
                COALESCE(SUM(CASE WHEN status = 'completed' THEN price ELSE 0 END), 0)::float AS spent
         FROM orders WHERE user_id = $1`,
        [userId]
      )
      .catch(() => ({ rows: [{ total: 0, spent: 0 }] }));

    const [walletUsd, referral] = await Promise.all([
      getWalletBalanceUsd(userId).catch(() => 0),
      getReferralSummary(userId).catch(() => null),
    ]);

    return NextResponse.json({
      user,
      profile,
      lastActivity: activityRes.rows[0] || null,
      wallet: { balanceUsd: walletUsd },
      referral: referral
        ? { balanceUsd: referral.balanceUsd, friendsReferred: referral.friendsReferred, earnedUsd: referral.earnedUsd }
        : null,
      orders: ordersRes.rows,
      stats: statsRes.rows[0],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load customer";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const admin = getAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { userId } = await params;

    await ensureUserAdminColumns();
    const body = await request.json().catch(() => ({}));
    const action = String(body.action || "");

    const exists = await pool.query(`SELECT id FROM "user" WHERE id = $1`, [userId]);
    if (exists.rows.length === 0) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    if (action === "block") {
      const reason = (body.reason || "").toString().trim() || "Blocked by admin";
      await pool.query(`UPDATE "user" SET banned = true, "banReason" = $2, "banExpires" = NULL WHERE id = $1`, [userId, reason]);
      // Revoke active sessions so the block takes effect immediately.
      await pool.query(`DELETE FROM session WHERE "userId" = $1`, [userId]).catch(() => {});
      return NextResponse.json({ ok: true, banned: true });
    }

    if (action === "unblock") {
      await pool.query(`UPDATE "user" SET banned = false, "banReason" = NULL, "banExpires" = NULL WHERE id = $1`, [userId]);
      return NextResponse.json({ ok: true, banned: false });
    }

    if (action === "delete") {
      // Remove auth-related rows first (avoids FK issues), then the profile and
      // the user. Historical orders/wallet ledgers keep the user_id reference.
      await pool.query(`DELETE FROM session WHERE "userId" = $1`, [userId]).catch(() => {});
      await pool.query(`DELETE FROM account WHERE "userId" = $1`, [userId]).catch(() => {});
      await pool.query(`DELETE FROM user_profiles WHERE user_id = $1`, [userId]).catch(() => {});
      await pool.query(`DELETE FROM "user" WHERE id = $1`, [userId]);
      return NextResponse.json({ ok: true, deleted: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update customer";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
