import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { STRIPE_ENABLED } from "@/lib/stripe";
import { PAYPAL_ENABLED } from "@/lib/paypal";
import { SUPPORTED_CURRENCIES, SupportedCurrency } from "@/lib/fx";
import { createTopupCheckout, createPaypalTopup } from "@/lib/wallet-topup";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const method = body.method === "paypal" ? "paypal" : "stripe";
    const rawCurrency = body.display_currency || "USD";
    const displayCurrency: SupportedCurrency = SUPPORTED_CURRENCIES.includes(rawCurrency as SupportedCurrency)
      ? (rawCurrency as SupportedCurrency)
      : "USD";
    const displayAmount = Number(body.amount);

    if (!Number.isFinite(displayAmount) || displayAmount <= 0) {
      return NextResponse.json({ error: "Enter a valid top-up amount" }, { status: 400 });
    }

    if (method === "paypal") {
      if (!PAYPAL_ENABLED) {
        return NextResponse.json({ error: "PayPal is not configured" }, { status: 503 });
      }
      const { url } = await createPaypalTopup({
        userId: session.user.id,
        displayCurrency,
        displayAmount,
      });
      return NextResponse.json({ url });
    }

    if (!STRIPE_ENABLED) {
      return NextResponse.json({ error: "Card payment is not configured" }, { status: 503 });
    }
    const { url } = await createTopupCheckout({
      userId: session.user.id,
      userEmail: session.user.email as string,
      displayCurrency,
      displayAmount,
    });

    return NextResponse.json({ url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to start top-up";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
