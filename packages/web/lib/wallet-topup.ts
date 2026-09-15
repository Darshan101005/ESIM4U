import pool from "@/lib/db";
import { stripe, resolveChargeCurrency, StripePaymentDetails } from "@/lib/stripe";
import { getFxRates, SupportedCurrency } from "@/lib/fx";
import { ensureWalletSchema, creditWallet } from "@/lib/wallet";
import { createPaypalOrder, type PaypalPaymentDetails } from "@/lib/paypal";
import { generateOrderReference } from "@/lib/orders-schema";
import { sendWalletTopupEmail } from "@/lib/email";

interface TopupRow {
  user_id: string;
  amount_usd: string;
  display_currency: string;
  display_amount: string;
  display_rate: string;
}

/** Fire-and-forget top-up confirmation email (never blocks/breaks crediting). */
async function notifyTopup(row: TopupRow, newBalanceUsd: number, method: "stripe" | "paypal"): Promise<void> {
  try {
    const u = await pool.query(`SELECT email, name FROM "user" WHERE id = $1`, [row.user_id]);
    const user = u.rows[0] as { email?: string; name?: string } | undefined;
    if (!user?.email) return;
    await sendWalletTopupEmail({
      email: user.email,
      name: user.name || "there",
      displayAmount: Number(row.display_amount),
      displayCurrency: row.display_currency,
      newBalanceUsd,
      displayRate: row.display_rate,
      method,
    });
  } catch {
    // email is best-effort — the wallet is already credited
  }
}

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
    `INSERT INTO wallet_topups (user_id, provider, stripe_session_id, amount_usd, display_currency, display_amount, display_rate, status)
     VALUES ($1,'stripe',$2,$3,$4,$5,$6,'pending')
     ON CONFLICT (stripe_session_id) DO NOTHING`,
    [userId, checkoutSession.id, amountUsd, displayCurrency, displayAmount, displayRate]
  );

  if (!checkoutSession.url) {
    throw new Error("Stripe did not return a checkout URL");
  }
  return { url: checkoutSession.url };
}

/**
 * Starts a PayPal wallet top-up. Mirrors createTopupCheckout but through PayPal:
 * the customer approves an order in their currency, and we record a pending
 * `wallet_topups` row keyed on the PayPal order id to credit on completion.
 */
export async function createPaypalTopup(params: {
  userId: string;
  displayCurrency: SupportedCurrency;
  displayAmount: number;
}): Promise<CreateTopupResult> {
  const { userId, displayCurrency } = params;
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const paypalOrder = await createPaypalOrder({
    amount: displayAmount.toFixed(2),
    currency: displayCurrency,
    reference: generateOrderReference(),
    description: "eSIM4U Wallet top-up",
    returnUrl: `${appUrl}/dashboard/topup/success`,
    cancelUrl: `${appUrl}/dashboard/topup`,
  });

  await ensureWalletSchema();
  await pool.query(
    `INSERT INTO wallet_topups (user_id, provider, paypal_order_id, amount_usd, display_currency, display_amount, display_rate, status)
     VALUES ($1,'paypal',$2,$3,$4,$5,$6,'pending')`,
    [userId, paypalOrder.id, amountUsd, displayCurrency, displayAmount, displayRate]
  );

  return { url: paypalOrder.approveUrl };
}

/**
 * Credits a completed top-up to the wallet exactly once. Atomically claims the
 * pending row (so the confirm-on-return and the webhook can't double-credit),
 * then credits. Returns true if it credited on this call.
 */
export async function completeTopup(stripeSessionId: string, payment?: StripePaymentDetails): Promise<boolean> {
  await ensureWalletSchema();

  // Claim pending OR failed: a top-up may have been swept to 'failed' by the
  // 30-min expiry before the (real) payment landed. This only runs once Stripe
  // confirms payment, so crediting an expired row is correct — and status
  // becoming 'completed' still prevents any double credit.
  const claim = await pool.query(
    `UPDATE wallet_topups SET status = 'completed', completed_at = now(), stripe_payment_intent = $2, receipt_url = $3
     WHERE stripe_session_id = $1 AND status IN ('pending', 'failed') RETURNING *`,
    [stripeSessionId, payment?.paymentIntentId ?? null, payment?.receiptUrl ?? null]
  );
  if (claim.rows.length === 0) return false;

  const row = claim.rows[0] as {
    user_id: string;
    amount_usd: string;
    display_currency: string;
    display_amount: string;
    display_rate: string;
  };

  const newBalance = await creditWallet({
    userId: row.user_id,
    amountUsd: Number(row.amount_usd),
    reason: "topup",
    reference: stripeSessionId,
    description: "Wallet top-up",
    displayCurrency: row.display_currency,
    displayAmount: Number(row.display_amount),
    displayRate: Number(row.display_rate),
  });

  void notifyTopup(row, newBalance, "stripe");
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

/** True if a PayPal order id belongs to a wallet top-up (vs a normal order). */
export async function paypalTopupExists(paypalOrderId: string): Promise<boolean> {
  await ensureWalletSchema();
  const r = await pool.query(`SELECT 1 FROM wallet_topups WHERE paypal_order_id = $1 LIMIT 1`, [paypalOrderId]);
  return r.rows.length > 0;
}

/**
 * Credits a completed PayPal top-up exactly once (same atomic-claim pattern as
 * the Stripe path). Returns true if it credited on this call.
 */
export async function completePaypalTopup(paypalOrderId: string, details?: PaypalPaymentDetails): Promise<boolean> {
  await ensureWalletSchema();

  // Claim pending OR failed (see completeTopup): a late PayPal capture after the
  // 30-min expiry sweep must still credit. Only runs once PayPal confirms
  // COMPLETED; 'completed'/'cancelled'/'refunded' rows are never re-credited.
  const claim = await pool.query(
    `UPDATE wallet_topups SET status = 'completed', completed_at = now(), paypal_capture_id = $2, payer_email = $3
     WHERE paypal_order_id = $1 AND status IN ('pending', 'failed') RETURNING *`,
    [paypalOrderId, details?.captureId ?? null, details?.payerEmail ?? null]
  );
  if (claim.rows.length === 0) return false;

  const row = claim.rows[0] as {
    user_id: string;
    amount_usd: string;
    display_currency: string;
    display_amount: string;
    display_rate: string;
  };

  const newBalance = await creditWallet({
    userId: row.user_id,
    amountUsd: Number(row.amount_usd),
    reason: "topup",
    reference: paypalOrderId,
    description: "Wallet top-up",
    displayCurrency: row.display_currency,
    displayAmount: Number(row.display_amount),
    displayRate: Number(row.display_rate),
  });

  void notifyTopup(row, newBalance, "paypal");
  return true;
}

/** Marks a pending PayPal top-up as cancelled (abandoned / declined). */
export async function cancelPaypalTopup(paypalOrderId: string): Promise<void> {
  await ensureWalletSchema();
  await pool.query(
    `UPDATE wallet_topups SET status = 'cancelled' WHERE paypal_order_id = $1 AND status = 'pending'`,
    [paypalOrderId]
  );
}

/** Same 30-minute window orders use before an unpaid attempt is abandoned. */
export const TOPUP_PENDING_TTL_MINUTES = 30;
/** How long soft-deleted top-ups stay in the recycle bin before purge. */
export const TOPUP_TRASH_TTL_DAYS = 30;

/**
 * Sweeps abandoned pending top-ups to `failed` once past the TTL — mirrors
 * expireStalePendingOrders. Run on read (listing top-ups) so no cron is needed.
 * Fixes top-ups that were left in `pending` because the customer never returned.
 */
export async function expireStalePendingTopups(): Promise<number> {
  await ensureWalletSchema();
  const res = await pool.query(
    `UPDATE wallet_topups SET status = 'failed'
     WHERE status = 'pending' AND created_at < now() - ($1 || ' minutes')::interval
     RETURNING id`,
    [String(TOPUP_PENDING_TTL_MINUTES)]
  );
  return res.rowCount ?? 0;
}

/** Permanently removes top-ups sitting in the recycle bin past the TTL. */
export async function purgeExpiredTopupTrash(): Promise<number> {
  await ensureWalletSchema();
  const res = await pool.query(
    `DELETE FROM wallet_topups
      WHERE deleted_scope IS NOT NULL AND deleted_at IS NOT NULL
        AND deleted_at < now() - ($1 || ' days')::interval
      RETURNING id`,
    [String(TOPUP_TRASH_TTL_DAYS)]
  );
  return res.rowCount ?? 0;
}
