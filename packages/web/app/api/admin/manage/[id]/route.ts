import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { verifyAdminToken, getAdminCookieName, ensureAdminColumns } from "@/lib/admin-auth";

function getRequester(request: NextRequest) {
  const token = request.cookies.get(getAdminCookieName())?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

// PATCH: edit an admin (name / email / role / active) — super admin only
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const requester = getRequester(request);
    if (!requester) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (requester.role !== "super_admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await ensureAdminColumns();
    const targetId = parseInt(params.id, 10);
    if (Number.isNaN(targetId)) return NextResponse.json({ error: "Invalid admin id" }, { status: 400 });

    const body = await request.json().catch(() => ({}));
    const updates: string[] = [];
    const values: (string | boolean | number)[] = [];
    let i = 1;

    if (typeof body.name === "string") {
      const name = body.name.trim();
      if (!name) return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
      updates.push(`name = $${i++}`);
      values.push(name);
    }

    if (typeof body.email === "string") {
      const email = body.email.trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
      const dupe = await pool.query(`SELECT id FROM admin_users WHERE email = $1 AND id <> $2`, [email, targetId]);
      if (dupe.rows.length > 0) return NextResponse.json({ error: "That email is already in use" }, { status: 409 });
      updates.push(`email = $${i++}`);
      values.push(email);
    }

    if (body.role === "admin" || body.role === "super_admin") {
      updates.push(`role = $${i++}`);
      values.push(body.role);
    }

    if (typeof body.is_active === "boolean") {
      // Prevent a super admin from pausing their own account (lockout safety).
      if (targetId === requester.id && body.is_active === false) {
        return NextResponse.json({ error: "You cannot pause your own account" }, { status: 400 });
      }
      updates.push(`is_active = $${i++}`);
      values.push(body.is_active);
    }

    if (typeof body.password === "string" && body.password.length > 0) {
      if (body.password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
      const hash = await bcrypt.hash(body.password, 12);
      updates.push(`password_hash = $${i++}`);
      values.push(hash);
    }

    if (updates.length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

    values.push(targetId);
    const result = await pool.query(
      `UPDATE admin_users SET ${updates.join(", ")} WHERE id = $${i} RETURNING id, email, name, role, is_active, created_at`,
      values
    );
    if (result.rows.length === 0) return NextResponse.json({ error: "Admin not found" }, { status: 404 });

    return NextResponse.json({ success: true, admin: result.rows[0] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update admin";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE: remove an admin — super admin only, cannot delete self
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const requester = getRequester(request);
    if (!requester) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (requester.role !== "super_admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const targetId = parseInt(params.id, 10);
    if (Number.isNaN(targetId)) return NextResponse.json({ error: "Invalid admin id" }, { status: 400 });

    // Any admin can be removed — including your own/seeded account — as long as
    // at least one admin account always remains (never lock everyone out).
    const countRes = await pool.query(`SELECT COUNT(*)::int AS c FROM admin_users`);
    if ((countRes.rows[0]?.c ?? 0) <= 1) {
      return NextResponse.json({ error: "At least one admin account must remain" }, { status: 400 });
    }

    const result = await pool.query(`DELETE FROM admin_users WHERE id = $1 RETURNING id`, [targetId]);
    if (result.rows.length === 0) return NextResponse.json({ error: "Admin not found" }, { status: 404 });

    // Signal to the client whether the requester just deleted themselves so it
    // can sign them out.
    return NextResponse.json({ success: true, selfDeleted: targetId === requester.id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete admin";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
