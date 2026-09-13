import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyAdminToken, getAdminCookieName, ensureAdminColumns } from "@/lib/admin-auth";

function getRequester(request: NextRequest) {
  const token = request.cookies.get(getAdminCookieName())?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

// DELETE: emergency turn-off of an admin's 2FA (super admin only). Used when an
// admin loses their authenticator device. Enabling can only be done by the
// account owner (they must scan the QR on their phone), so there's no enable here.
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const requester = getRequester(request);
    if (!requester) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (requester.role !== "super_admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const targetId = parseInt(params.id, 10);
    if (Number.isNaN(targetId)) return NextResponse.json({ error: "Invalid admin id" }, { status: 400 });

    await ensureAdminColumns();
    const result = await pool.query(
      `UPDATE admin_users SET totp_secret = NULL, totp_pending_secret = NULL, totp_enabled = false
       WHERE id = $1 RETURNING id`,
      [targetId]
    );
    if (result.rows.length === 0) return NextResponse.json({ error: "Admin not found" }, { status: 404 });

    return NextResponse.json({ success: true, selfDisabled: targetId === requester.id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to turn off 2FA";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
