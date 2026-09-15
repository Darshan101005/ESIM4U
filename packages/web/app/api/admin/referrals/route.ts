import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, getAdminCookieName } from "@/lib/admin-auth";
import { getReferralSummary } from "@/lib/referral";

function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(getAdminCookieName())?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

/**
 * Read-only view of a customer's full referral standing for the admin panel:
 * their invite code/link, friends referred + qualified, credit balance, lifetime
 * earned/spent and the full referral-credit ledger. Mirrors what the customer
 * sees on their own /dashboard/referrals page.
 */
export async function GET(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  try {
    const summary = await getReferralSummary(userId);
    return NextResponse.json(summary);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load referrals";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
