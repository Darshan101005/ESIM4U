import pool from "@/lib/db";

let ensured = false;

/**
 * Creates the support tables (live chat, tickets, notifications, admin presence).
 * Idempotent + cached per process — safe to call at the top of any handler.
 */
export async function ensureSupportSchema(): Promise<void> {
  if (ensured) return;
  await pool.query(`
    -- One live-chat conversation per customer.
    CREATE TABLE IF NOT EXISTS support_conversations (
      user_id TEXT PRIMARY KEY,
      user_email TEXT,
      customer_name TEXT,
      status VARCHAR(12) NOT NULL DEFAULT 'open',   -- open | resolved
      last_message_at TIMESTAMPTZ,
      last_message_preview TEXT,
      last_sender VARCHAR(8),                        -- user | admin
      resolved_at TIMESTAMPTZ,
      resolved_by VARCHAR(120),
      reopened_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS support_messages (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,        -- conversation owner (the customer)
      sender VARCHAR(8) NOT NULL,   -- user | admin
      sender_name TEXT,
      body TEXT,
      attachments JSONB NOT NULL DEFAULT '[]',
      read_at TIMESTAMPTZ,          -- when the recipient read it (drives double tick)
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_support_messages_user ON support_messages (user_id, created_at);

    CREATE TABLE IF NOT EXISTS support_tickets (
      id SERIAL PRIMARY KEY,
      ticket_ref VARCHAR(24) UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
      user_email TEXT,
      customer_name TEXT,
      title TEXT NOT NULL,
      subject TEXT,
      category VARCHAR(80),
      department VARCHAR(80),
      status VARCHAR(16) NOT NULL DEFAULT 'open',   -- open | answered | resolved | closed
      last_reply_by VARCHAR(8),                     -- user | admin
      last_reply_at TIMESTAMPTZ,
      user_read_at TIMESTAMPTZ,
      admin_read_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets (user_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS support_ticket_messages (
      id SERIAL PRIMARY KEY,
      ticket_id INTEGER NOT NULL,
      sender VARCHAR(8) NOT NULL,   -- user | admin
      sender_name TEXT,
      body TEXT,
      attachments JSONB NOT NULL DEFAULT '[]',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket ON support_ticket_messages (ticket_id, created_at);

    -- Notification feed powering the bell on both sides.
    CREATE TABLE IF NOT EXISTS support_notifications (
      id SERIAL PRIMARY KEY,
      audience VARCHAR(8) NOT NULL,   -- user | admin
      user_id TEXT,                   -- audience=user: recipient; audience=admin: related customer
      kind VARCHAR(16) NOT NULL,      -- chat | ticket
      ref TEXT,                       -- ticket_ref, or conversation user_id for chat
      title TEXT,
      body TEXT,
      read BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_support_notifications_audience ON support_notifications (audience, read, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_support_notifications_user ON support_notifications (audience, user_id, read);

    -- Admin online/offline presence (heartbeat). Support is "online" if ANY admin
    -- has a recent heartbeat.
    CREATE TABLE IF NOT EXISTS admin_presence (
      admin_id INTEGER PRIMARY KEY,
      admin_name TEXT,
      last_seen TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- Quote/reply support (WhatsApp-style): points at the message being replied to.
    ALTER TABLE support_messages ADD COLUMN IF NOT EXISTS reply_to_id INTEGER;
    -- WhatsApp-style deletes: "for everyone" (tombstone both sides) + per-side "for me".
    ALTER TABLE support_messages ADD COLUMN IF NOT EXISTS deleted_for_everyone BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE support_messages ADD COLUMN IF NOT EXISTS deleted_for_user BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE support_messages ADD COLUMN IF NOT EXISTS deleted_for_admin BOOLEAN NOT NULL DEFAULT false;
  `);
  ensured = true;
}
