import { NextRequest, NextResponse } from "next/server";
import { verifyOTP } from "@/lib/otp";
import { sendVerificationSuccessEmail } from "@/lib/email";
import pool from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and verification code are required" },
        { status: 400 }
      );
    }

    if (typeof otp !== "string" || !/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { error: "Invalid verification code format" },
        { status: 400 }
      );
    }

    const isValid = await verifyOTP(email, otp);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid or expired verification code" },
        { status: 400 }
      );
    }

    await pool.query(
      `UPDATE "user" SET "emailVerified" = true WHERE email = $1`,
      [email]
    );

    const userResult = await pool.query(
      `SELECT name FROM "user" WHERE email = $1`,
      [email]
    );

    const name = userResult.rows[0]?.name || "User";

    try {
      await sendVerificationSuccessEmail(email, name);
    } catch (_) {}

    return NextResponse.json({
      message: "Email verified successfully",
    });
  } catch (_) {
    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}
