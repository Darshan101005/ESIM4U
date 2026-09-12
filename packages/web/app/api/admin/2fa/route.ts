import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyAdminToken, getAdminCookieName, ensureAdminColumns } from "@/lib/admin-auth";

function getRequester(request: NextRequest) {
  const token = request.cookies.get(getAdminCookieName())?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

// GET: current admin's 2FA status.
export async function GET(request: NextRequest) {
  const requester = getRequester(request);
  if (!requester) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureAdminColumns();
  const r = await pool.query(`SELECT totp_enabled FROM admin_users WHERE id = $1`, [requester.id]);
  if (r.rows.length === 0) return NextResponse.json({ error: "Admin not found" }, { status: 404 });

  return NextResponse.json({ enabled: r.rows[0].totp_enabled === true });
}
