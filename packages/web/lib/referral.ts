import pool from "@/lib/db";

/**
 * Referral module.
 *
 * - Both the referrer (link sender) and the referee (link receiver) earn a
 *   fixed reward, but ONLY once the referee makes a qualifying purchase whose
 *   cart value is at least the minimum (USD base).
 * - Rewards are "referral credits" held in a SEPARATE ledger from the wallet.
 *   They can only be redeemed on an order of at least the minimum value, and
 *   only a slab percentage of the balance may be redeemed per order (10% per
 *   full minimum-tier of cart value, capped at 100%).
 */

export const REFERRAL_REWARD_USD = 3;
export const REFERRAL_MIN_PURCHASE_USD = 25;
export const REFERRAL_SITE_URL = "https://esim4u.uk";

function round(v: number): number {
  return Math.round(v * 100) / 100;
}

let schemaReady = false;

export async function ensureReferralSchema(): Promise<void> {
  if (schemaReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS referral_accounts (
      user_id TEXT PRIMARY KEY,
      code VARCHAR(16) UNIQUE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS referrals (
      id SERIAL PRIMARY KEY,
      referrer_user_id TEXT NOT NULL,
      referee_user_id TEXT UNIQUE NOT NULL,
      code VARCHAR(16) NOT NULL,
      status VARCHAR(12) NOT NULL DEFAULT 'pending',
      reward_usd NUMERIC(10,2) NOT NULL DEFAULT 3,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      qualified_at TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals (referrer_user_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS referral_ledger (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      direction VARCHAR(6) NOT NULL,
      amount_usd NUMERIC(10,2) NOT NULL,
      balance_after_usd NUMERIC(10,2) NOT NULL,
      reason VARCHAR(24) NOT NULL,
      reference TEXT,
      description TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_referral_ledger_user ON referral_ledger (user_id, created_at DESC);
  `);
  schemaReady = true;
}

function generateCode(): string {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

/** Returns the user's referral code, creating a unique one on first use. */
export async function getOrCreateReferralCode(userId: string): Promise<string> {
  await ensureReferralSchema();
  const existing = await pool.query(`SELECT code FROM referral_accounts WHERE user_id = $1`, [userId]);
  if (existing.rows.length > 0) return existing.rows[0].code;

  for (let attempt = 0; attempt < 6; attempt++) {
    const code = generateCode();
    try {
      await pool.query(`INSERT INTO referral_accounts (user_id, code) VALUES ($1, $2)`, [userId, code]);
      return code;
    } catch {
      // unique collision on code — retry
    }
  }
  // Deterministic fallback if we somehow keep colliding.
  const fallback = userId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10).toUpperCase() || generateCode();
  await pool.query(`INSERT INTO referral_accounts (user_id, code) VALUES ($1, $2) ON CONFLICT (user_id) DO NOTHING`, [userId, fallback]);
  const row = await pool.query(`SELECT code FROM referral_accounts WHERE user_id = $1`, [userId]);
  return row.rows[0]?.code || fallback;
}

export async function resolveReferrer(code: string): Promise<string | null> {
  await ensureReferralSchema();
  const clean = (code || "").trim().toUpperCase();
  if (!clean) return null;
  const r = await pool.query(`SELECT user_id FROM referral_accounts WHERE code = $1`, [clean]);
  return r.rows[0]?.user_id ?? null;
}

/**
 * Records a referral relationship on signup. One-time per referee. Returns true
 * if a new referral was created.
 */
export async function attachReferral(refereeUserId: string, code: string): Promise<boolean> {
  await ensureReferralSchema();
  const referrerId = await resolveReferrer(code);
  if (!referrerId || referrerId === refereeUserId) return false;

  const existing = await pool.query(`SELECT id FROM referrals WHERE referee_user_id = $1`, [refereeUserId]);
  if (existing.rows.length > 0) return false;

  const res = await pool.query(
    `INSERT INTO referrals (referrer_user_id, referee_user_id, code, status, reward_usd)
     VALUES ($1, $2, $3, 'pending', $4)
     ON CONFLICT (referee_user_id) DO NOTHING`,
    [referrerId, refereeUserId, (code || "").trim().toUpperCase(), REFERRAL_REWARD_USD]
  );
  return (res.rowCount ?? 0) > 0;
}

/* ------------------------------------------------------------------ */
/* Referral credit ledger                                             */
/* ------------------------------------------------------------------ */

export async function getReferralBalanceUsd(userId: string): Promise<number> {
  await ensureReferralSchema();
  const r = await pool.query(
    `SELECT COALESCE(SUM(CASE WHEN direction = 'credit' THEN amount_usd ELSE -amount_usd END), 0) AS bal
     FROM referral_ledger WHERE user_id = $1`,
    [userId]
  );
  return round(Number(r.rows[0].bal));
}

interface LedgerMutation {
  userId: string;
  amountUsd: number;
  reason: "reward" | "redeemed" | "refund";
  reference?: string | null;
  description?: string | null;
}

async function mutateLedger(direction: "credit" | "debit", p: LedgerMutation): Promise<number> {
  await getOrCreateReferralCode(p.userId); // ensures a lockable account row exists
  const amount = round(p.amountUsd);
  if (!(amount > 0)) return getReferralBalanceUsd(p.userId);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Serialize per-user ledger writes using the account row as a mutex.
    await client.query(`SELECT 1 FROM referral_accounts WHERE user_id = $1 FOR UPDATE`, [p.userId]);
    const cur = await client.query(
      `SELECT COALESCE(SUM(CASE WHEN direction = 'credit' THEN amount_usd ELSE -amount_usd END), 0) AS bal
       FROM referral_ledger WHERE user_id = $1`,
      [p.userId]
    );
    const balance = Number(cur.rows[0].bal);

    let newBalance: number;
    if (direction === "debit") {
      if (amount > balance + 1e-9) {
        throw new Error("INSUFFICIENT_REFERRAL_CREDIT");
      }
      newBalance = round(balance - amount);
    } else {
      newBalance = round(balance + amount);
    }

    await client.query(
      `INSERT INTO referral_ledger (user_id, direction, amount_usd, balance_after_usd, reason, reference, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [p.userId, direction, amount, newBalance, p.reason, p.reference ?? null, p.description ?? null]
    );
    await client.query("COMMIT");
    return newBalance;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export const creditReferral = (p: LedgerMutation) => mutateLedger("credit", p);
export const debitReferral = (p: LedgerMutation) => mutateLedger("debit", p);

/* ------------------------------------------------------------------ */
/* Qualification + redemption                                          */
/* ------------------------------------------------------------------ */

/**
 * Called after a checkout completes. If the referee has a pending referral and
 * the qualifying cart value meets the minimum, grants the reward to BOTH the
 * referrer and the referee (once).
 */
export async function qualifyReferralIfEligible(refereeUserId: string, cartValueUsd: number): Promise<void> {
  if (cartValueUsd + 1e-9 < REFERRAL_MIN_PURCHASE_USD) return;
  await ensureReferralSchema();

  const pending = await pool.query(`SELECT * FROM referrals WHERE referee_user_id = $1 AND status = 'pending'`, [refereeUserId]);
  if (pending.rows.length === 0) return;
  const ref = pending.rows[0];

  // Atomically claim so the reward is granted only once.
  const claim = await pool.query(
    `UPDATE referrals SET status = 'qualified', qualified_at = now() WHERE id = $1 AND status = 'pending' RETURNING *`,
    [ref.id]
  );
  if (claim.rows.length === 0) return;

  const reward = Number(ref.reward_usd) || REFERRAL_REWARD_USD;
  await creditReferral({
    userId: ref.referrer_user_id,
    amountUsd: reward,
    reason: "reward",
    reference: `referral-${ref.id}`,
    description: "Referral reward — your friend made their first eligible purchase",
  });
  await creditReferral({
    userId: ref.referee_user_id,
    amountUsd: reward,
    reason: "reward",
    reference: `referral-${ref.id}`,
    description: "Welcome bonus — thanks for joining through a friend",
  });
}

/**
 * Returns any redeemed referral credit on the given orders back to the ledger.
 * Used when a checkout is cancelled / expired / rejected before completion.
 * The redeemed total lives on the first order row (referral_credit_used); this
 * atomically claims the un-refunded rows so a credit can never be returned
 * twice. `whereClause` is an internal, non-user column name.
 */
export async function refundReferralForOrders(whereClause: string, whereValue: string): Promise<void> {
  await ensureReferralSchema();
  const claimed = await pool.query(
    `UPDATE orders SET referral_credit_refunded = true
     WHERE ${whereClause} = $1
       AND COALESCE(referral_credit_used, 0) > 0
       AND COALESCE(referral_credit_refunded, false) = false
     RETURNING user_id, referral_credit_used, order_reference`,
    [whereValue]
  );

  for (const row of claimed.rows as { user_id: string; referral_credit_used: string; order_reference: string }[]) {
    const amount = Number(row.referral_credit_used);
    if (!(amount > 0)) continue;
    try {
      await creditReferral({
        userId: row.user_id,
        amountUsd: amount,
        reason: "refund",
        reference: row.order_reference,
        description: "Referral credit returned — order was not completed",
      });
    } catch (e) {
      // If crediting fails, undo the claim so it can be retried.
      await pool.query(
        `UPDATE orders SET referral_credit_refunded = false WHERE order_reference = $1`,
        [row.order_reference]
      );
      throw e;
    }
  }
}

/** Percentage of the referral balance redeemable for a cart of the given value. */
export function redeemablePercent(cartUsd: number): number {
  if (cartUsd + 1e-9 < REFERRAL_MIN_PURCHASE_USD) return 0;
  const tiers = Math.floor((cartUsd + 1e-9) / REFERRAL_MIN_PURCHASE_USD);
  return Math.min(100, tiers * 10);
}

/** Max referral credit (USD) redeemable for this cart, capped by balance + amount due. */
export function computeRedeemableUsd(cartUsd: number, balanceUsd: number, amountDueUsd?: number): number {
  const pct = redeemablePercent(cartUsd);
  if (pct <= 0 || balanceUsd <= 0) return 0;
  let amount = round((balanceUsd * pct) / 100);
  amount = Math.min(amount, round(balanceUsd));
  if (amountDueUsd != null) amount = Math.min(amount, round(amountDueUsd));
  return Math.max(0, amount);
}

/* ------------------------------------------------------------------ */
/* Summary for the referrals page                                      */
/* ------------------------------------------------------------------ */

export interface ReferralLedgerEntry {
  direction: "credit" | "debit";
  amount_usd: string;
  reason: string;
  description: string | null;
  created_at: string;
}

export interface ReferralSummary {
  code: string;
  link: string;
  friendsReferred: number;
  qualifiedCount: number;
  balanceUsd: number;
  earnedUsd: number;
  spentUsd: number;
  history: ReferralLedgerEntry[];
}

export async function getReferralSummary(userId: string): Promise<ReferralSummary> {
  await ensureReferralSchema();
  const code = await getOrCreateReferralCode(userId);

  const friends = await pool.query(`SELECT status FROM referrals WHERE referrer_user_id = $1`, [userId]);
  const friendsReferred = friends.rowCount ?? 0;
  const qualifiedCount = friends.rows.filter((f) => f.status === "qualified").length;

  const balanceUsd = await getReferralBalanceUsd(userId);

  const ledger = await pool.query(
    `SELECT direction, amount_usd, reason, description, created_at
     FROM referral_ledger WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`,
    [userId]
  );
  const history = ledger.rows as ReferralLedgerEntry[];
  const earnedUsd = round(history.filter((h) => h.direction === "credit").reduce((s, h) => s + Number(h.amount_usd), 0));
  const spentUsd = round(history.filter((h) => h.direction === "debit").reduce((s, h) => s + Number(h.amount_usd), 0));

  return {
    code,
    link: `${REFERRAL_SITE_URL}/signup?ref=${code}`,
    friendsReferred,
    qualifiedCount,
    balanceUsd,
    earnedUsd,
    spentUsd,
    history,
  };
}
