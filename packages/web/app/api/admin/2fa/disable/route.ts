import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyAdminToken, getAdminCookieName, ensureAdminColumns } from "@/lib/admin-auth";

function getRequester(request: NextRequest) {
  const token = request.cookies.get(getAdminCookieName())?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

// POST: turn 2FA off for the current admin (confirmed in the UI). Clears the
// stored secret so a fresh QR is generated if it's ever re-enabled.
export async function POST(request: NextRequest) {
  const requester = getRequester(request);
  if (!requester) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureAdminColumns();
  const r = await pool.query(`SELECT totp_enabled FROM admin_users WHERE id = $1`, [requester.id]);
  if (r.rows.length === 0) return NextResponse.json({ error: "Admin not found" }, { status: 404 });

  await pool.query(
    `UPDATE admin_users SET totp_secret = NULL, totp_pending_secret = NULL, totp_enabled = false WHERE id = $1`,
    [requester.id]
  );

  return NextResponse.json({ success: true, enabled: false });
}
