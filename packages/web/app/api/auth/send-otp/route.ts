import { NextRequest, NextResponse } from "next/server";
import { createOTP, getRemainingResends } from "@/lib/otp";
import { sendOTPEmail } from "@/lib/email";
import pool from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const userResult = await pool.query(
      `SELECT name, "emailVerified" FROM "user" WHERE email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (userResult.rows[0].emailVerified) {
      return NextResponse.json(
        { error: "Email is already verified" },
        { status: 400 }
      );
    }

    const name = userResult.rows[0].name;
    const otp = await createOTP(email);
    await sendOTPEmail(email, otp, name);
    const remaining = await getRemainingResends(email);

    return NextResponse.json({
      message: "Verification code sent successfully",
      remainingResends: remaining,
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "RATE_LIMIT_EXCEEDED") {
      return NextResponse.json(
        { error: "Too many attempts. Please try again in an hour." },
        { status: 429 }
      );
    }
    if (err.message === "SEND_FAILED") {
      return NextResponse.json(
        { error: "Failed to send verification email. Please try again." },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
