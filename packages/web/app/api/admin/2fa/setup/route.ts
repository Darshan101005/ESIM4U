import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import pool from "@/lib/db";
import { verifyAdminToken, getAdminCookieName, ensureAdminColumns } from "@/lib/admin-auth";
import { generateTotpSecret, otpauthURL } from "@/lib/totp";

function getRequester(request: NextRequest) {
  const token = request.cookies.get(getAdminCookieName())?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

// POST: begin 2FA setup for the current admin. Generates a fresh secret, stores
// it as *pending* (not yet active), and returns the QR + seed to scan. The
// secret only becomes active once a valid code is confirmed via /enable.
export async function POST(request: NextRequest) {
  const requester = getRequester(request);
  if (!requester) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureAdminColumns();
  const r = await pool.query(`SELECT email, totp_enabled FROM admin_users WHERE id = $1`, [requester.id]);
  if (r.rows.length === 0) return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  if (r.rows[0].totp_enabled === true) {
    return NextResponse.json({ error: "Two-factor authentication is already enabled" }, { status: 400 });
  }

  const secret = generateTotpSecret();
  await pool.query(`UPDATE admin_users SET totp_pending_secret = $1 WHERE id = $2`, [secret, requester.id]);

  const label = r.rows[0].email || `admin-${requester.id}`;
  const otpauth = otpauthURL(secret, label);
  const qrDataUrl = await QRCode.toDataURL(otpauth, { width: 240, margin: 1, errorCorrectionLevel: "M" });

  return NextResponse.json({ secret, otpauth, qrDataUrl });
}
