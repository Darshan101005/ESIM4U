import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, getAdminCookieName } from "@/lib/admin-auth";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(getAdminCookieName())?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = verifyAdminToken(token);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Read the current name/email/role fresh from the DB so display reflects any updates.
  let name = admin.name;
  let email = admin.email;
  let role = admin.role;
  try {
    const r = await pool.query(`SELECT name, email, role FROM admin_users WHERE id = $1`, [admin.id]);
    if (r.rows.length > 0) {
      name = r.rows[0].name;
      email = r.rows[0].email;
      role = r.rows[0].role === "super_admin" ? "super_admin" : "admin";
    }
  } catch {}

  return NextResponse.json({
    name: name?.trim() || "Darshan V",
    email: email || "darshanvenkatesan2005@gmail.com",
    role,
  });
}
