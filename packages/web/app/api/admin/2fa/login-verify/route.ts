import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import {
  verifyPending2faToken,
  getAdmin2faCookieName,
  getAdminCookieName,
  generateAdminToken,
  ensureAdminColumns,
  type AdminRole,
} from "@/lib/admin-auth";
import { verifyTotp } from "@/lib/totp";

// POST: second login step. Reads the short-lived pending cookie, verifies the
// authenticator code, and — on success — issues the real admin session.
export async function POST(request: NextRequest) {
  const pendingToken = request.cookies.get(getAdmin2faCookieName())?.value;
  const pending = pendingToken ? verifyPending2faToken(pendingToken) : null;
  if (!pending) {
    return NextResponse.json({ error: "Your login step expired. Please sign in again." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const code = String(body.code || "").trim();
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Enter the 6-digit code from your authenticator app" }, { status: 400 });
  }

  await ensureAdminColumns();
  const r = await pool.query(
    `SELECT id, email, name, role, is_active, totp_enabled, totp_secret, created_at FROM admin_users WHERE id = $1`,
    [pending.id]
  );
  if (r.rows.length === 0) return NextResponse.json({ error: "Admin not found" }, { status: 404 });

  const row = r.rows[0];
  if (row.is_active === false) {
    return NextResponse.json({ error: "This admin account has been paused." }, { status: 403 });
  }
  if (row.totp_enabled !== true || !row.totp_secret) {
    return NextResponse.json({ error: "Two-factor authentication isn't set up. Please sign in again." }, { status: 400 });
  }

  if (!verifyTotp(row.totp_secret, code)) {
    return NextResponse.json({ error: "That code isn't right. Please try again." }, { status: 400 });
  }

  const role: AdminRole = row.role === "super_admin" ? "super_admin" : "admin";
  const token = generateAdminToken({
    id: row.id,
    email: row.email,
    name: row.name,
    role,
    created_at: row.created_at,
  });

  const response = NextResponse.json({
    success: true,
    admin: { id: row.id, email: row.email, name: row.name, role },
  });

  response.cookies.set(getAdminCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
  // Consume the pending cookie.
  response.cookies.set(getAdmin2faCookieName(), "", { path: "/", maxAge: 0 });

  return response;
}
