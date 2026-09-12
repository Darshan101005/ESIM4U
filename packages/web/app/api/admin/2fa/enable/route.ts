import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyAdminToken, getAdminCookieName, ensureAdminColumns } from "@/lib/admin-auth";
import { verifyTotp } from "@/lib/totp";

function getRequester(request: NextRequest) {
  const token = request.cookies.get(getAdminCookieName())?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

// POST: confirm the setup code and switch 2FA on. Verifies the entered code
// against the pending secret; on success the pending secret becomes active.
export async function POST(request: NextRequest) {
  const requester = getRequester(request);
  if (!requester) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const code = String(body.code || "").trim();
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Enter the 6-digit code from your authenticator app" }, { status: 400 });
  }

  await ensureAdminColumns();
  const r = await pool.query(`SELECT totp_pending_secret, totp_enabled FROM admin_users WHERE id = $1`, [requester.id]);
  if (r.rows.length === 0) return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  if (r.rows[0].totp_enabled === true) {
    return NextResponse.json({ error: "Two-factor authentication is already enabled" }, { status: 400 });
  }

  const pending = r.rows[0].totp_pending_secret as string | null;
  if (!pending) {
    return NextResponse.json({ error: "Start the setup again — no pending secret found" }, { status: 400 });
  }

  if (!verifyTotp(pending, code)) {
    return NextResponse.json({ error: "That code isn't right. Please try again." }, { status: 400 });
  }

  await pool.query(
    `UPDATE admin_users SET totp_secret = $1, totp_pending_secret = NULL, totp_enabled = true WHERE id = $2`,
    [pending, requester.id]
  );

  return NextResponse.json({ success: true, enabled: true });
}
