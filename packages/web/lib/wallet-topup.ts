import pool from "@/lib/db";
import { stripe, resolveChargeCurrency, StripePaymentDetails } from "@/lib/stripe";
import { getFxRates, SupportedCurrency } from "@/lib/fx";
import { ensureWalletSchema, creditWallet } from "@/lib/wallet";

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Stripe's minimum chargeable amount is ~0.50 in the settlement currency. */
export const MIN_TOPUP_DISPLAY = 1;
export const MAX_TOPUP_DISPLAY = 5000;

export interface CreateTopupResult {
  url: string;
}

/**
 * Starts a wallet top-up. The customer picks an amount in THEIR currency; we
 * charge exactly that amount in that currency (test mode = the sandbox demo),
 * and record the canonical USD value to credit on success. A pending
 * `wallet_topups` row makes crediting idempotent across the confirm + webhook
 * paths (same claim pattern as order fulfilment).
 */
export async function createTopupCheckout(params: {
  userId: string;
  userEmail: string;
  displayCurrency: SupportedCurrency;
  displayAmount: number;
}): Promise<CreateTopupResult> {
  const { userId, userEmail, displayCurrency } = params;
  const displayAmount = round(params.displayAmount);

  if (!(displayAmount >= MIN_TOPUP_DISPLAY) || displayAmount > MAX_TOPUP_DISPLAY) {
    throw new Error(`Enter an amount between ${MIN_TOPUP_DISPLAY} and ${MAX_TOPUP_DISPLAY}`);
  }

  const fx = await getFxRates();
  const displayRate = fx.rates[displayCurrency] ?? 1;
  const amountUsd = round(displayAmount / displayRate);
  if (!(amountUsd > 0)) {
    throw new Error("Could not price this top-up. Please try again shortly.");
  }

  const chargeCurrency = resolveChargeCurrency(displayCurrency);
  const unitAmount = Math.round(displayAmount * 100);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: userEmail,
    client_reference_id: userId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: chargeCurrency,
          unit_amount: unitAmount,
          product_data: { name: "eSIM4U Wallet top-up" },
        },
      },
    ],
    metadata: {
      purpose: "wallet_topup",
      userId,
      amountUsd: String(amountUsd),
      displayCurrency,
      displayAmount: String(displayAmount),
      displayRate: String(displayRate),
    },
    success_url: `${appUrl}/dashboard/topup/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/dashboard/topup`,
  });

  await ensureWalletSchema();
  await pool.query(
    `INSERT INTO wallet_topups (user_id, stripe_session_id, amount_usd, display_currency, display_amount, display_rate, status)
     VALUES ($1,$2,$3,$4,$5,$6,'pending')
     ON CONFLICT (stripe_session_id) DO NOTHING`,
    [userId, checkoutSession.id, amountUsd, displayCurrency, displayAmount, displayRate]
  );

  if (!checkoutSession.url) {
    throw new Error("Stripe did not return a checkout URL");
  }
  return { url: checkoutSession.url };
}

/**
 * Credits a completed top-up to the wallet exactly once. Atomically claims the
 * pending row (so the confirm-on-return and the webhook can't double-credit),
 * then credits. Returns true if it credited on this call.
 */
export async function completeTopup(stripeSessionId: string, payment?: StripePaymentDetails): Promise<boolean> {
  await ensureWalletSchema();

  const claim = await pool.query(
    `UPDATE wallet_topups SET status = 'completed', completed_at = now(), stripe_payment_intent = $2
     WHERE stripe_session_id = $1 AND status = 'pending' RETURNING *`,
    [stripeSessionId, payment?.paymentIntentId ?? null]
  );
  if (claim.rows.length === 0) return false;

  const row = claim.rows[0] as {
    user_id: string;
    amount_usd: string;
    display_currency: string;
    display_amount: string;
    display_rate: string;
  };

  await creditWallet({
    userId: row.user_id,
    amountUsd: Number(row.amount_usd),
    reason: "topup",
    reference: stripeSessionId,
    description: "Wallet top-up",
    displayCurrency: row.display_currency,
    displayAmount: Number(row.display_amount),
    displayRate: Number(row.display_rate),
  });

  return true;
}

/** Marks a pending top-up as cancelled (expired / abandoned). No money captured. */
export async function cancelTopup(stripeSessionId: string): Promise<void> {
  await ensureWalletSchema();
  await pool.query(
    `UPDATE wallet_topups SET status = 'cancelled' WHERE stripe_session_id = $1 AND status = 'pending'`,
    [stripeSessionId]
  );
}

export function isTopupSession(metadata: Record<string, string> | null | undefined): boolean {
  return metadata?.purpose === "wallet_topup";
}
