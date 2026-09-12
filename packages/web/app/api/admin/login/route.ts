import { NextRequest, NextResponse } from "next/server";
import {
  verifyAdminCredentials,
  generateAdminToken,
  getAdminCookieName,
  generatePending2faToken,
  getAdmin2faCookieName,
} from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const admin = await verifyAdminCredentials(email, password);

    if (!admin) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (admin.is_active === false) {
      return NextResponse.json({ error: "This admin account has been paused. Contact a super admin." }, { status: 403 });
    }

    // 2FA is on: don't issue the real session yet. Hand out a short-lived
    // pending token and ask the client for the authenticator code.
    if (admin.totp_enabled) {
      const pending = generatePending2faToken(admin.id);
      const response = NextResponse.json({ success: true, twoFactorRequired: true });
      response.cookies.set(getAdmin2faCookieName(), pending, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 5 * 60,
        path: "/",
      });
      // Make sure no stale full session lingers.
      response.cookies.set(getAdminCookieName(), "", { path: "/", maxAge: 0 });
      return response;
    }

    const token = generateAdminToken(admin);

    const response = NextResponse.json({
      success: true,
      admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
    });

    response.cookies.set(getAdminCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Login failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
