import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { stripe, STRIPE_ENABLED, extractPaymentDetails } from "@/lib/stripe";
import { completeTopup } from "@/lib/wallet-topup";
import { getWalletBalanceUsd } from "@/lib/wallet";

export async function POST(request: NextRequest) {
  try {
    if (!STRIPE_ENABLED) {
      return NextResponse.json({ error: "Payment is not configured" }, { status: 503 });
    }

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const sessionId = (body.session_id || "").trim();
    if (!sessionId) {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
    }

    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent", "payment_intent.latest_charge"],
    });

    if (checkoutSession.metadata?.purpose !== "wallet_topup") {
      return NextResponse.json({ error: "This session is not a wallet top-up" }, { status: 400 });
    }
    if (checkoutSession.metadata?.userId !== session.user.id) {
      return NextResponse.json({ error: "This payment does not belong to your account" }, { status: 403 });
    }
    if (checkoutSession.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed", status: checkoutSession.payment_status }, { status: 402 });
    }

    const payment = extractPaymentDetails(checkoutSession);
    await completeTopup(sessionId, payment);
    const balanceUsd = await getWalletBalanceUsd(session.user.id);

    return NextResponse.json({ balanceUsd });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to confirm top-up";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
