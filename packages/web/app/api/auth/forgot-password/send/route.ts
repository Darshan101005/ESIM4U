import { NextRequest, NextResponse } from "next/server";
import { createOTP, getRemainingResends } from "@/lib/otp";
import { sendPasswordResetOTP } from "@/lib/email";
import pool from "@/lib/db";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== "string" || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }

    const userResult = await pool.query(`SELECT name FROM "user" WHERE email = $1`, [email]);

    // Block non-existent accounts upfront so a user isn't left waiting for an
    // email that will never arrive (and can't burn through resend attempts).
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "No account found for this email address." }, { status: 404 });
    }

    const name = userResult.rows[0].name || "there";
    const otp = await createOTP(email);
    await sendPasswordResetOTP(email, otp, name);

    const remaining = await getRemainingResends(email);
    return NextResponse.json({
      message: "A reset code has been sent to your email.",
      remainingResends: remaining,
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "RATE_LIMIT_EXCEEDED") {
      return NextResponse.json({ error: "Too many attempts. Please try again in an hour." }, { status: 429 });
    }
    if (err.message === "SEND_FAILED") {
      return NextResponse.json({ error: "Failed to send the reset email. Please try again." }, { status: 500 });
    }
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
