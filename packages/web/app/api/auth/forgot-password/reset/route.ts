import { NextRequest, NextResponse } from "next/server";
import { verifyOTP } from "@/lib/otp";
import { auth } from "@/lib/auth";
import pool from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { email, otp, newPassword } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    if (typeof otp !== "string" || !/^\d{6}$/.test(otp)) {
      return NextResponse.json({ error: "Invalid verification code format" }, { status: 400 });
    }
    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }
    if (newPassword.length > 128) {
      return NextResponse.json({ error: "Password is too long" }, { status: 400 });
    }

    const valid = await verifyOTP(email, otp);
    if (!valid) {
      return NextResponse.json({ error: "Invalid or expired verification code" }, { status: 400 });
    }

    // Set the new password through Better Auth's internal context so it's hashed
    // exactly like a normal signup. We intentionally do NOT check password
    // history — users may reuse a previous password.
    const ctx = await auth.$context;
    const found = await ctx.internalAdapter.findUserByEmail(email, { includeAccounts: true });
    if (!found?.user) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const userId = found.user.id;
    const hashedPassword = await ctx.password.hash(newPassword);

    const credential = await ctx.internalAdapter.findCredentialAccount(userId);
    if (!credential) {
      // e.g. a Google-only account setting a password for the first time.
      await ctx.internalAdapter.createAccount({
        userId,
        providerId: "credential",
        issuer: "local:credential",
        accountId: userId,
        password: hashedPassword,
      });
    } else {
      await ctx.internalAdapter.updatePassword(userId, hashedPassword);
    }

    // They proved control of the mailbox, so mark the email verified too.
    await pool.query(`UPDATE "user" SET "emailVerified" = true WHERE email = $1`, [email]);

    // Sign out any existing sessions so the new password takes effect everywhere.
    try {
      await ctx.internalAdapter.deleteUserSessions(userId);
    } catch {}

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to reset password";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
