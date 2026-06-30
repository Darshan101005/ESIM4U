import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY || "";

export const stripe = new Stripe(secretKey);

export const STRIPE_ENABLED = Boolean(secretKey);

export type ChargeCurrency = "usd" | "gbp" | "eur";

export function resolveChargeCurrency(displayCurrency: string | undefined | null): ChargeCurrency {
  const c = (displayCurrency || "USD").toUpperCase();
  if (c === "EUR") return "eur";
  if (c === "GBP") return "gbp";
  return "usd";
}

export interface StripePaymentDetails {
  paymentIntentId: string | null;
  chargeId: string | null;
  cardBrand: string | null;
  cardLast4: string | null;
  cardWallet: string | null;
  methodType: string | null;
  receiptUrl: string | null;
  /** Total charged in the smallest currency unit (e.g. cents/pence), used for refund maths. */
  chargeTotalMinor: number | null;
}

/**
 * Pulls payment details out of an expanded Checkout Session.
 * The session MUST be retrieved with expand: ["payment_intent", "payment_intent.latest_charge"].
 */
export function extractPaymentDetails(session: Stripe.Checkout.Session): StripePaymentDetails {
  const pi = typeof session.payment_intent === "object" ? session.payment_intent : null;
  const charge = pi && typeof pi.latest_charge === "object" ? pi.latest_charge : null;
  const card = charge?.payment_method_details?.card ?? null;

  return {
    paymentIntentId: pi?.id ?? (typeof session.payment_intent === "string" ? session.payment_intent : null),
    chargeId: charge?.id ?? null,
    cardBrand: card?.brand ?? null,
    cardLast4: card?.last4 ?? null,
    cardWallet: card?.wallet?.type ?? null,
    methodType: charge?.payment_method_details?.type ?? null,
    receiptUrl: charge?.receipt_url ?? null,
    chargeTotalMinor: session.amount_total ?? null,
  };
}
