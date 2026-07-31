import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyAdminToken, getAdminCookieName, createAdminUser, ensureAdminColumns, AdminRole } from "@/lib/admin-auth";

function getRequester(request: NextRequest) {
  const token = request.cookies.get(getAdminCookieName())?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

// GET: list all admins (super admin only)
export async function GET(request: NextRequest) {
  try {
    const requester = getRequester(request);
    if (!requester) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (requester.role !== "super_admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await ensureAdminColumns();
    const result = await pool.query(
      `SELECT id, email, name, role, is_active, created_at FROM admin_users ORDER BY created_at ASC, id ASC`
    );

    return NextResponse.json({ admins: result.rows, currentAdminId: requester.id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load admins";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST: enroll a new admin (super admin only)
export async function POST(request: NextRequest) {
  try {
    const requester = getRequester(request);
    if (!requester) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (requester.role !== "super_admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const name = (body.name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";
    const role: AdminRole = body.role === "super_admin" ? "super_admin" : "admin";

    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });

    const admin = await createAdminUser(email, password, name, role);
    return NextResponse.json({
      success: true,
      admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create admin";
    const status = message.includes("already exists") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
