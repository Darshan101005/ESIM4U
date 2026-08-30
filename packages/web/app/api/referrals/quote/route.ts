import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  getReferralBalanceUsd,
  redeemablePercent,
  computeRedeemableUsd,
  REFERRAL_MIN_PURCHASE_USD,
} from "@/lib/referral";

/**
 * Given the current cart value (USD) and amount due, returns how much referral
 * credit the customer may redeem on this order. Drives the checkout card.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const cartUsd = Number(body.cart_usd);
    const amountDueUsd = body.amount_due_usd != null ? Number(body.amount_due_usd) : undefined;

    if (!Number.isFinite(cartUsd) || cartUsd < 0) {
      return NextResponse.json({ error: "Invalid cart value" }, { status: 400 });
    }

    const balanceUsd = await getReferralBalanceUsd(session.user.id);
    const percent = redeemablePercent(cartUsd);
    const redeemableUsd = computeRedeemableUsd(cartUsd, balanceUsd, amountDueUsd);
    const eligible = cartUsd + 1e-9 >= REFERRAL_MIN_PURCHASE_USD;

    return NextResponse.json({
      eligible,
      minPurchaseUsd: REFERRAL_MIN_PURCHASE_USD,
      balanceUsd,
      percent,
      redeemableUsd,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to quote referral credit";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
