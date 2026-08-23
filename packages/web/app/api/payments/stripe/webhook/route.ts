import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, STRIPE_ENABLED, extractPaymentDetails } from "@/lib/stripe";
import { fulfillSession, cancelSession } from "@/lib/fulfillment";
import { completeTopup, cancelTopup, isTopupSession } from "@/lib/wallet-topup";

// Stripe needs the raw, unparsed body to verify the signature.
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!STRIPE_ENABLED) {
    return NextResponse.json({ error: "Payment is not configured" }, { status: 503 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: `Webhook signature verification failed: ${msg}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      // Card (synchronous) success, and delayed/async methods that later succeed.
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status === "paid") {
          const full = await stripe.checkout.sessions.retrieve(session.id, {
            expand: ["payment_intent", "payment_intent.latest_charge"],
          });
          const payment = extractPaymentDetails(full);
          if (isTopupSession(full.metadata)) {
            await completeTopup(session.id, payment);
          } else {
            await fulfillSession(session.id, payment);
          }
        }
        break;
      }

      // Payment never completed — release the pending orders / top-up (no money captured).
      case "checkout.session.async_payment_failed":
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (isTopupSession(session.metadata)) {
          await cancelTopup(session.id);
        } else {
          await cancelSession(session.id);
        }
        break;
      }

      default:
        // Other events are acknowledged but not acted on.
        break;
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Webhook handler error";
    // Return 500 so Stripe retries delivery.
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
