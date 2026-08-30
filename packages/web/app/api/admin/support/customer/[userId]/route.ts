import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, getAdminCookieName } from "@/lib/admin-auth";
import pool from "@/lib/db";
import { getWalletBalanceUsd } from "@/lib/wallet";
import { getReferralSummary } from "@/lib/referral";

function getAdmin(request: NextRequest) {
  const token = request.cookies.get(getAdminCookieName())?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

/**
 * Aggregates everything an agent needs to have full context on a customer:
 * identity, profile (phone/country), wallet balance, referral standing, and
 * recent orders/plans. Read-only.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const admin = getAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { userId } = await params;

    const userRes = await pool.query(`SELECT id, name, email, "createdAt" FROM "user" WHERE id = $1`, [userId]);
    const user = userRes.rows[0] || null;

    const profileRes = await pool
      .query(`SELECT phone, country, preferred_currency FROM user_profiles WHERE user_id = $1`, [userId])
      .catch(() => ({ rows: [] as { phone?: string; country?: string; preferred_currency?: string }[] }));
    const profile = profileRes.rows[0] || {};

    const ordersRes = await pool
      .query(
        `SELECT id, order_reference, bundle_name, country, data_amount, validity, price, status, created_at
         FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10`,
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
