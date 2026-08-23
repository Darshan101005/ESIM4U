import pool from "@/lib/db";
import { BANK_DETAILS, DEFAULT_BANK_DETAILS, BankDetails } from "@/lib/bank-details";

export { BANK_DETAILS };

/* ------------------------------------------------------------------ */
/* Editable beneficiary bank details (single-row settings table).      */
/* ------------------------------------------------------------------ */

let bankSettingsReady = false;

export async function ensureBankSettingsSchema(): Promise<void> {
  if (bankSettingsReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bank_account_settings (
      id INT PRIMARY KEY DEFAULT 1,
      account_name TEXT NOT NULL,
      bank_name TEXT NOT NULL,
      account_holder TEXT NOT NULL,
      account_number TEXT NOT NULL,
      sort_code TEXT NOT NULL,
      swift TEXT NOT NULL DEFAULT '',
      iban TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT bank_account_settings_singleton CHECK (id = 1)
    );
  `);
  // Seed the single row with defaults if it doesn't exist yet.
  await pool.query(
    `INSERT INTO bank_account_settings (id, account_name, bank_name, account_holder, account_number, sort_code, swift, iban)
     VALUES (1,$1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (id) DO NOTHING`,
    [
      DEFAULT_BANK_DETAILS.accountName,
      DEFAULT_BANK_DETAILS.bankName,
      DEFAULT_BANK_DETAILS.accountHolder,
      DEFAULT_BANK_DETAILS.accountNumber,
      DEFAULT_BANK_DETAILS.sortCode,
      DEFAULT_BANK_DETAILS.swift,
      DEFAULT_BANK_DETAILS.iban,
    ]
  );
  bankSettingsReady = true;
}

export async function getBankDetails(): Promise<BankDetails> {
  await ensureBankSettingsSchema();
  const r = await pool.query(`SELECT * FROM bank_account_settings WHERE id = 1`);
  if (r.rows.length === 0) return { ...DEFAULT_BANK_DETAILS };
  const row = r.rows[0];
  return {
    accountName: row.account_name,
    bankName: row.bank_name,
    accountHolder: row.account_holder,
    accountNumber: row.account_number,
    sortCode: row.sort_code,
    swift: row.swift || "",
    iban: row.iban || "",
  };
}

export async function updateBankDetails(d: BankDetails): Promise<void> {
  await ensureBankSettingsSchema();
  await pool.query(
    `UPDATE bank_account_settings
       SET account_name = $1, bank_name = $2, account_holder = $3, account_number = $4,
           sort_code = $5, swift = $6, iban = $7, updated_at = now()
     WHERE id = 1`,
    [d.accountName, d.bankName, d.accountHolder, d.accountNumber, d.sortCode, d.swift, d.iban]
  );
}

export type BankTransferStatus =
  | "pending_verification"
  | "processing"
  | "completed"
  | "rejected"
  | "on_hold"
  | "failed";

export interface BankTransferRow {
  id: number;
  reference: string;
  user_id: string;
  user_email: string;
  customer_name: string | null;
  amount_usd: string;
  display_currency: string;
  display_amount: string;
  display_rate: string;
  txn_reference: string | null;
  amount_paid: string | null;
  sender_name: string | null;
  payment_date: string | null;
  note: string | null;
  proof_urls: string[];
  status: BankTransferStatus;
  admin_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

let schemaReady = false;

export async function ensureBankTransferSchema(): Promise<void> {
  if (schemaReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bank_transfers (
      id SERIAL PRIMARY KEY,
      reference TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
      user_email TEXT NOT NULL,
      customer_name TEXT,
      amount_usd NUMERIC(12,2) NOT NULL,
      display_currency VARCHAR(3) NOT NULL,
      display_amount NUMERIC(12,2) NOT NULL,
      display_rate NUMERIC(14,6) NOT NULL,
      txn_reference TEXT,
      amount_paid TEXT,
      sender_name TEXT,
      payment_date TEXT,
      note TEXT,
      proof_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
      status VARCHAR(24) NOT NULL DEFAULT 'pending_verification',
      admin_note TEXT,
      reviewed_by TEXT,
      reviewed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_bank_transfers_user ON bank_transfers (user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_bank_transfers_status ON bank_transfers (status, created_at DESC);
  `);
  schemaReady = true;
}

export function generateBankRef(): string {
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `BT-${t}-${r}`;
}

export interface CreateBankTransferInput {
  reference: string;
  userId: string;
  userEmail: string;
  customerName: string | null;
  amountUsd: number;
  displayCurrency: string;
  displayAmount: number;
  displayRate: number;
  txnReference: string | null;
  amountPaid: string | null;
  senderName: string | null;
  paymentDate: string | null;
  note: string | null;
  proofUrls: string[];
}

export async function createBankTransfer(input: CreateBankTransferInput): Promise<void> {
  await ensureBankTransferSchema();
  await pool.query(
    `INSERT INTO bank_transfers
       (reference, user_id, user_email, customer_name, amount_usd, display_currency, display_amount, display_rate,
        txn_reference, amount_paid, sender_name, payment_date, note, proof_urls, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb,'pending_verification')`,
    [
      input.reference,
      input.userId,
      input.userEmail,
      input.customerName,
      input.amountUsd,
      input.displayCurrency,
      input.displayAmount,
      input.displayRate,
      input.txnReference,
      input.amountPaid,
      input.senderName,
      input.paymentDate,
      input.note,
      JSON.stringify(input.proofUrls),
    ]
  );
}

export async function getBankTransfers(status?: BankTransferStatus | "all"): Promise<BankTransferRow[]> {
  await ensureBankTransferSchema();
  if (status && status !== "all") {
    const r = await pool.query(`SELECT * FROM bank_transfers WHERE status = $1 ORDER BY created_at DESC`, [status]);
    return r.rows as BankTransferRow[];
  }
  const r = await pool.query(`SELECT * FROM bank_transfers ORDER BY created_at DESC`);
  return r.rows as BankTransferRow[];
}

export async function getBankTransferById(id: number): Promise<BankTransferRow | null> {
  await ensureBankTransferSchema();
  const r = await pool.query(`SELECT * FROM bank_transfers WHERE id = $1`, [id]);
  return (r.rows[0] as BankTransferRow) || null;
}

export async function setBankTransferStatus(
  id: number,
  status: BankTransferStatus,
  reviewedBy: string,
  adminNote?: string | null
): Promise<void> {
  await ensureBankTransferSchema();
  await pool.query(
    `UPDATE bank_transfers SET status = $1, reviewed_by = $2, reviewed_at = now(),
       admin_note = COALESCE($3, admin_note) WHERE id = $4`,
    [status, reviewedBy, adminNote ?? null, id]
  );
}
