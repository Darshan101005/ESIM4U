import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, getAdminCookieName } from "@/lib/admin-auth";
import pool from "@/lib/db";
import { ensureUserAdminColumns } from "@/lib/user-admin-schema";

function getAdmin(request: NextRequest) {
  const token = request.cookies.get(getAdminCookieName())?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

/** SQL predicate for each CRM segment (uses aliases u / p / o). */
const SEGMENT_SQL: Record<string, string> = {
  all: "TRUE",
  verified: `u."emailVerified" = true`,
  unverified: `COALESCE(u."emailVerified", false) = false`,
  active: `p.last_seen_at > now() - interval '30 days'`,
  dormant: `(p.last_seen_at IS NULL OR p.last_seen_at < now() - interval '30 days')`,
  blocked: `COALESCE(u.banned, false) = true`,
  new: `u."createdAt" > now() - interval '7 days'`,
  customers: `COALESCE(o.cnt, 0) > 0`,
  leads: `COALESCE(o.cnt, 0) = 0`,
};

const JOINS = `
  FROM "user" u
  LEFT JOIN user_profiles p ON p.user_id = u.id
  LEFT JOIN (
    SELECT user_id, COUNT(*) AS cnt,
           COALESCE(SUM(CASE WHEN status = 'completed' THEN price ELSE 0 END), 0) AS spend
    FROM orders GROUP BY user_id
  ) o ON o.user_id = u.id
`;

export async function GET(request: NextRequest) {
  try {
    const admin = getAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureUserAdminColumns();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;
    const search = (searchParams.get("search") || "").trim();
    const segment = SEGMENT_SQL[searchParams.get("segment") || "all"] ? searchParams.get("segment") || "all" : "all";

    const where: string[] = [SEGMENT_SQL[segment]];
    const params: (string | number)[] = [];
    if (search) {
      params.push(`%${search}%`);
      where.push(`(u.name ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
    }
    const whereClause = `WHERE ${where.join(" AND ")}`;

    const listParams = [...params, limit, offset];
    const listSql = `
      SELECT u.id, u.name, u.email, u."emailVerified", u."createdAt", COALESCE(u.banned, false) AS banned,
             p.last_seen_at, COALESCE(o.cnt, 0)::int AS order_count, COALESCE(o.spend, 0)::float AS total_spent
      ${JOINS}
      ${whereClause}
      ORDER BY u."createdAt" DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

    const countSql = `SELECT COUNT(*)::int AS total ${JOINS} ${whereClause}`;

    // Global segment counts (ignore search) for the filter chips.
    const countsSql = `
      SELECT
        COUNT(*)::int AS all,
        COUNT(*) FILTER (WHERE u."emailVerified" = true)::int AS verified,
        COUNT(*) FILTER (WHERE COALESCE(u."emailVerified", false) = false)::int AS unverified,
        COUNT(*) FILTER (WHERE p.last_seen_at > now() - interval '30 days')::int AS active,
        COUNT(*) FILTER (WHERE p.last_seen_at IS NULL OR p.last_seen_at < now() - interval '30 days')::int AS dormant,
        COUNT(*) FILTER (WHERE COALESCE(u.banned, false) = true)::int AS blocked,
        COUNT(*) FILTER (WHERE u."createdAt" > now() - interval '7 days')::int AS new,
        COUNT(*) FILTER (WHERE COALESCE(o.cnt, 0) > 0)::int AS customers,
        COUNT(*) FILTER (WHERE COALESCE(o.cnt, 0) = 0)::int AS leads
      ${JOINS}`;

    const [usersResult, countResult, countsResult] = await Promise.all([
      pool.query(listSql, listParams),
      pool.query(countSql, params),
      pool.query(countsSql),
    ]);

    return NextResponse.json({
      users: usersResult.rows,
      total: countResult.rows[0].total,
      counts: countsResult.rows[0],
      page,
      limit,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch users";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
