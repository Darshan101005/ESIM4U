import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { verifyAdminToken, getAdminCookieName } from "@/lib/admin-auth";

function getAdminId(request: NextRequest): number | null {
  const token = request.cookies.get(getAdminCookieName())?.value;
  if (!token) return null;
  const admin = verifyAdminToken(token);
  return admin?.id ?? null;
}

export async function POST(request: NextRequest) {
  try {
    const adminId = getAdminId(request);
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const action = body.action;

    if (action === "updateName") {
      const name = (body.name || "").trim();
      if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
      await pool.query(`UPDATE admin_users SET name = $1 WHERE id = $2`, [name, adminId]);
      return NextResponse.json({ success: true, name });
    }

    if (action === "updateEmail") {
      const email = (body.email || "").trim().toLowerCase();
      const currentPassword = body.currentPassword || "";
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
      }
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password is required" }, { status: 400 });
      }
      const r = await pool.query(`SELECT password_hash FROM admin_users WHERE id = $1`, [adminId]);
      if (r.rows.length === 0) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const ok = await bcrypt.compare(currentPassword, r.rows[0].password_hash);
      if (!ok) return NextResponse.json({ error: "Current password is incorrect" }, { status: 403 });

      const exists = await pool.query(`SELECT id FROM admin_users WHERE email = $1 AND id <> $2`, [email, adminId]);
      if (exists.rows.length > 0) return NextResponse.json({ error: "That email is already in use" }, { status: 409 });

      await pool.query(`UPDATE admin_users SET email = $1 WHERE id = $2`, [email, adminId]);
      return NextResponse.json({ success: true, email });
    }

    if (action === "changePassword") {
      const oldPassword = body.oldPassword || "";
      const newPassword = body.newPassword || "";
      if (!oldPassword || !newPassword) {
        return NextResponse.json({ error: "All password fields are required" }, { status: 400 });
      }
      if (newPassword.length < 8) {
        return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
      }
      const r = await pool.query(`SELECT password_hash FROM admin_users WHERE id = $1`, [adminId]);
      if (r.rows.length === 0) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const ok = await bcrypt.compare(oldPassword, r.rows[0].password_hash);
      if (!ok) return NextResponse.json({ error: "Current password is incorrect" }, { status: 403 });

      const hash = await bcrypt.hash(newPassword, 12);
      await pool.query(`UPDATE admin_users SET password_hash = $1 WHERE id = $2`, [hash, adminId]);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
