import pool from "@/lib/db";

let ensured = false;

/**
 * Stores contact-form submissions (from guests or logged-in users) so the admin
 * team has a record in the dashboard in addition to the emailed copy.
 * Idempotent + cached per process.
 */
export async function ensureContactSchema(): Promise<void> {
  if (ensured) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id SERIAL PRIMARY KEY,
      ref VARCHAR(24) UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT,
      message TEXT NOT NULL,
      user_id TEXT,                 -- set when a logged-in user submits
      status VARCHAR(12) NOT NULL DEFAULT 'new',  -- new | read | replied | closed
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages (status, created_at DESC);
  `);
  ensured = true;
}
