import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, getAdminCookieName } from "@/lib/admin-auth";
import { ensureContactSchema } from "@/lib/contact-schema";
import pool from "@/lib/db";

function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(getAdminCookieName())?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await ensureContactSchema();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const where = status && status !== "all" ? `WHERE status = $1` : "";
  const params = status && status !== "all" ? [status] : [];

  const rows = await pool.query(
    `SELECT id, ref, name, email, subject, message, user_id, status, created_at
     FROM contact_messages ${where}
     ORDER BY created_at DESC
     LIMIT 200`,
    params
  );

  const counts = await pool.query(
    `SELECT status, COUNT(*)::int AS n FROM contact_messages GROUP BY status`
  );
  const countMap: Record<string, number> = {};
  for (const r of counts.rows) countMap[r.status] = r.n;

  return NextResponse.json({ messages: rows.rows, counts: countMap });
}

export async function PATCH(request: NextRequest) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await ensureContactSchema();

  const body = await request.json().catch(() => ({}));
  const id = Number(body.id);
  const status = String(body.status || "");
  const allowed = ["new", "read", "replied", "closed"];
  if (!id || !allowed.includes(status)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  await pool.query(`UPDATE contact_messages SET status = $1 WHERE id = $2`, [status, id]);
  return NextResponse.json({ ok: true });
}
