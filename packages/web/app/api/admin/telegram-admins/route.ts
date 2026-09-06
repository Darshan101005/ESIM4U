import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, getAdminCookieName } from "@/lib/admin-auth";
import { listAdminUsernames, addAdminUsername, removeAdminUsername } from "@/lib/telegram-link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Manage the Telegram admin allowlist (super admin only).
 *
 * A Telegram user whose @username is on this list can sign in to the admin
 * bridge straight from the bot — no code or password. There is no email/password
 * admin login in the bot anymore.
 *
 * GET    → { admins: [{ username, name, created_at }] }
 * POST   → add { username, name? }
 * DELETE → remove { username }
 */

function getRequester(request: NextRequest) {
  const token = request.cookies.get(getAdminCookieName())?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

export async function GET(request: NextRequest) {
  const requester = getRequester(request);
  if (!requester) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (requester.role !== "super_admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const admins = await listAdminUsernames();
  return NextResponse.json({ admins });
}

export async function POST(request: NextRequest) {
  const requester = getRequester(request);
  if (!requester) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (requester.role !== "super_admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const username = (body.username || "").toString();
  const name = body.name ? body.name.toString().trim() : null;
  if (!username.trim()) return NextResponse.json({ error: "Username is required" }, { status: 400 });

  try {
    const added = await addAdminUsername(username, name);
    if (!added) return NextResponse.json({ error: "That username is already an admin" }, { status: 409 });
    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error && e.message === "EMPTY_USERNAME" ? "Username is required" : "Failed to add admin";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const requester = getRequester(request);
  if (!requester) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (requester.role !== "super_admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const username = (body.username || "").toString();
  if (!username.trim()) return NextResponse.json({ error: "Username is required" }, { status: 400 });
  await removeAdminUsername(username);
  return NextResponse.json({ success: true });
}
