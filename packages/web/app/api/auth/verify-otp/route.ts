import { NextRequest, NextResponse } from "next/server";
import { verifyOTP } from "@/lib/otp";
import { sendVerificationSuccessEmail } from "@/lib/email";
import pool from "@/lib/db";

function parseDeviceName(ua: string): string {
  let browser = "Unknown Browser";
  let os = "Unknown OS";

  // Detect browser
  if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("OPR/") || ua.includes("Opera")) browser = "Opera";
  else if (ua.includes("Chrome/") && !ua.includes("Edg/")) browser = "Chrome";
  else if (ua.includes("Safari/") && !ua.includes("Chrome/")) browser = "Safari";
  else if (ua.includes("Firefox/")) browser = "Firefox";

  // Detect OS / device
  if (ua.includes("iPhone")) os = "iPhone";
  else if (ua.includes("iPad")) os = "iPad";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS X") || ua.includes("Macintosh")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";

  if (!ua) return "Unknown Device";
  return `${browser} on ${os}`;
}

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

    // Capture login details for the success email
    const userAgent = request.headers.get("user-agent") || "";
    const deviceName = parseDeviceName(userAgent);
    const now = new Date();
    const dateTime = now.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZoneName: "short",
    });

    try {
      await sendVerificationSuccessEmail(email, name, dateTime, deviceName);
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
