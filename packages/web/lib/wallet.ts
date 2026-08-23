import pool from "@/lib/db";

/**
 * Wallet money is stored canonically in USD (`balance_usd`), exactly like order
 * prices, and displayed in the customer's chosen currency via the currency
 * context. Each transaction also captures the display currency/amount/rate at
 * the moment it happened so the history renders a stable, locked figure.
 */

export type WalletDirection = "credit" | "debit";
export type WalletReason =
  | "topup"
  | "purchase"
  | "refund"
  | "referral"
  | "admin_credit"
  | "admin_debit";

export interface WalletTransaction {
  id: number;
  direction: WalletDirection;
  reason: WalletReason;
  amount_usd: string;
  balance_after_usd: string;
  display_currency: string | null;
  display_amount: string | null;
  display_rate: string | null;
  reference: string | null;
  description: string | null;
  created_by: string | null;
  created_at: string;
}

export class WalletError extends Error {
  code: "INSUFFICIENT_FUNDS" | "INVALID_AMOUNT";
  constructor(code: WalletError["code"], message: string) {
    super(message);
    this.name = "WalletError";
    this.code = code;
  }
}

let schemaReady = false;

/**
 * Creates the wallet tables if they don't exist. Idempotent + cached per
 * process, safe to call on every request (mirrors ensureOrderPaymentColumns).
 */
export async function ensureWalletSchema(): Promise<void> {
  if (schemaReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS wallets (
      user_id TEXT PRIMARY KEY,
      balance_usd NUMERIC(12,2) NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      direction VARCHAR(6) NOT NULL,
      reason VARCHAR(24) NOT NULL,
      amount_usd NUMERIC(12,2) NOT NULL,
      balance_after_usd NUMERIC(12,2) NOT NULL,
      display_currency VARCHAR(3),
      display_amount NUMERIC(12,2),
      display_rate NUMERIC(14,6),
      reference TEXT,
      description TEXT,
      created_by TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_wallet_tx_user ON wallet_transactions (user_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS wallet_topups (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      stripe_session_id TEXT UNIQUE NOT NULL,
      amount_usd NUMERIC(12,2) NOT NULL,
      display_currency VARCHAR(3) NOT NULL,
      display_amount NUMERIC(12,2) NOT NULL,
      display_rate NUMERIC(14,6) NOT NULL,
      status VARCHAR(12) NOT NULL DEFAULT 'pending',
      stripe_payment_intent TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      completed_at TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS idx_wallet_topups_user ON wallet_topups (user_id, created_at DESC);
  `);
  schemaReady = true;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function getWalletBalanceUsd(userId: string): Promise<number> {
  await ensureWalletSchema();
  const r = await pool.query(`SELECT balance_usd FROM wallets WHERE user_id = $1`, [userId]);
  if (r.rows.length === 0) return 0;
  return Number(r.rows[0].balance_usd);
}

export async function getWalletHistory(userId: string, limit = 100): Promise<WalletTransaction[]> {
  await ensureWalletSchema();
  const r = await pool.query(
    `SELECT id, direction, reason, amount_usd, balance_after_usd, display_currency, display_amount,
            display_rate, reference, description, created_by, created_at
     FROM wallet_transactions WHERE user_id = $1 ORDER BY created_at DESC, id DESC LIMIT $2`,
    [userId, limit]
  );
  return r.rows as WalletTransaction[];
}

export interface WalletMutation {
  userId: string;
  amountUsd: number;
  reason: WalletReason;
  reference?: string | null;
  description?: string | null;
  displayCurrency?: string | null;
  displayAmount?: number | null;
  displayRate?: number | null;
  /** Admin id/email when a credit/debit is performed by staff. */
  createdBy?: string | null;
}

/** Adds funds to a wallet atomically. Returns the new balance (USD). */
export async function creditWallet(p: WalletMutation): Promise<number> {
  return mutateWallet("credit", p);
}

/**
 * Removes funds from a wallet atomically. Throws WalletError("INSUFFICIENT_FUNDS")
 * if the balance is too low. Returns the new balance (USD).
 */
export async function debitWallet(p: WalletMutation): Promise<number> {
  return mutateWallet("debit", p);
}

async function mutateWallet(direction: WalletDirection, p: WalletMutation): Promise<number> {
  await ensureWalletSchema();
  const amount = round(p.amountUsd);
  if (!(amount > 0)) {
    throw new WalletError("INVALID_AMOUNT", "Amount must be greater than zero");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Ensure a wallet row exists, then lock it for the balance read/update so
    // concurrent credits/debits can't race and corrupt the running total.
    await client.query(
      `INSERT INTO wallets (user_id, balance_usd) VALUES ($1, 0) ON CONFLICT (user_id) DO NOTHING`,
      [p.userId]
    );
    const cur = await client.query(`SELECT balance_usd FROM wallets WHERE user_id = $1 FOR UPDATE`, [p.userId]);
    const balance = Number(cur.rows[0].balance_usd);

    let newBalance: number;
    if (direction === "debit") {
      if (amount > balance + 1e-9) {
        throw new WalletError("INSUFFICIENT_FUNDS", "Insufficient wallet balance");
      }
      newBalance = round(balance - amount);
    } else {
      newBalance = round(balance + amount);
    }

    await client.query(`UPDATE wallets SET balance_usd = $1, updated_at = now() WHERE user_id = $2`, [
      newBalance,
      p.userId,
    ]);

    await client.query(
      `INSERT INTO wallet_transactions
         (user_id, direction, reason, amount_usd, balance_after_usd, display_currency, display_amount, display_rate, reference, description, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        p.userId,
        direction,
        p.reason,
        amount,
        newBalance,
        p.displayCurrency ?? null,
        p.displayAmount != null ? round(p.displayAmount) : null,
        p.displayRate ?? null,
        p.reference ?? null,
        p.description ?? null,
        p.createdBy ?? null,
      ]
    );

    await client.query("COMMIT");
    return newBalance;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
