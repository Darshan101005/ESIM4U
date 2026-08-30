import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { attachReferral } from "@/lib/referral";

/**
 * Records the referral relationship right after signup. Called from the signup
 * page with the referee's fresh user id + the referral code from the invite
 * link. Validates the user exists and isn't already referred. The reward is
 * only granted later, when the referee makes a qualifying purchase.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const code = (body.code || "").trim();
    const refereeUserId = (body.refereeUserId || "").trim();

    if (!code || !refereeUserId) {
      return NextResponse.json({ error: "Missing code or user" }, { status: 400 });
    }

    // Guard: the referee must be a real, recently-created user.
    const user = await pool.query(`SELECT id FROM "user" WHERE id = $1`, [refereeUserId]);
    if (user.rows.length === 0) {
      return NextResponse.json({ error: "Unknown user" }, { status: 400 });
    }

    const attached = await attachReferral(refereeUserId, code);
    return NextResponse.json({ attached });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to attach referral";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
