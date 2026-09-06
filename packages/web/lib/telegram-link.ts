import pool from "@/lib/db";

/**
 * Telegram account-linking + lightweight conversation state.
 *
 * Linking model (secure by design — no passwords are ever typed into chat):
 *  - A logged-in customer generates a short 6-char alphanumeric code on the
 *    website (Profile → Connect Telegram). They send `/link CODE` to the bot,
 *    which binds their Telegram chat to their eSIM4U user id.
 *  - Admins link the same way via a code generated in the admin panel, binding
 *    their Telegram chat to an admin_users row for the `/admin` bridge.
 *
 * Codes are single-use and expire quickly. The `telegram_state` table holds the
 * bot's per-chat conversation mode (e.g. "typing a support message", "replying
 * to customer X") so multi-step flows work without a long-running process.
 */

let schemaReady = false;

export async function ensureTelegramSchema(): Promise<void> {
  if (schemaReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS telegram_users (
      chat_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      username TEXT,
      first_name TEXT,
      linked_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_telegram_users_user ON telegram_users (user_id);

    CREATE TABLE IF NOT EXISTS telegram_link_codes (
      code TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      expires_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS telegram_admins (
      chat_id TEXT PRIMARY KEY,
      username TEXT,
      name TEXT,
      linked_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    ALTER TABLE telegram_admins ADD COLUMN IF NOT EXISTS username TEXT;
    ALTER TABLE telegram_admins ADD COLUMN IF NOT EXISTS name TEXT;
    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'telegram_admins' AND column_name = 'admin_id'
      ) THEN
        ALTER TABLE telegram_admins ALTER COLUMN admin_id DROP NOT NULL;
      END IF;
    END $$;

    -- Allowlist of admin Telegram usernames (managed from the admin panel).
    -- Stored lowercase, without the leading "@".
    CREATE TABLE IF NOT EXISTS telegram_admin_usernames (
      username TEXT PRIMARY KEY,
      name TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS telegram_state (
      chat_id TEXT PRIMARY KEY,
      mode TEXT,
      data JSONB,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  schemaReady = true;
}

/** 6-char uppercase alphanumeric code, avoiding easily-confused characters. */
function genCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I,O,0,1
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

const CODE_TTL_MINUTES = 15;

/* ------------------------------------------------------------------ */
/* Customer linking                                                    */
/* ------------------------------------------------------------------ */

/** Generates (or replaces) a fresh link code for a customer. */
export async function createLinkCode(userId: string): Promise<{ code: string; expiresAt: string }> {
  await ensureTelegramSchema();
  // Clear any prior unused codes for this user so only the newest works.
  await pool.query(`DELETE FROM telegram_link_codes WHERE user_id = $1`, [userId]);

  for (let attempt = 0; attempt < 6; attempt++) {
    const code = genCode();
    try {
      const r = await pool.query(
        `INSERT INTO telegram_link_codes (code, user_id, expires_at)
         VALUES ($1, $2, now() + ($3 || ' minutes')::interval)
         RETURNING expires_at`,
        [code, userId, String(CODE_TTL_MINUTES)]
      );
      return { code, expiresAt: r.rows[0].expires_at };
    } catch {
      // code collision — retry
    }
  }
  throw new Error("Could not generate a link code");
}

/**
 * Consumes a customer link code and binds the Telegram chat to the user.
 * Returns the linked user id, or null if the code is invalid/expired.
 */
export async function consumeLinkCode(
  code: string,
  chat: { chatId: string; username?: string | null; firstName?: string | null }
): Promise<string | null> {
  await ensureTelegramSchema();
  const clean = (code || "").trim().toUpperCase();
  if (!clean) return null;

  const r = await pool.query(
    `DELETE FROM telegram_link_codes WHERE code = $1 AND expires_at > now() RETURNING user_id`,
    [clean]
  );
  if (r.rows.length === 0) return null;
  const userId = r.rows[0].user_id as string;

  // One Telegram chat maps to exactly one user; re-linking overwrites.
  await pool.query(
    `INSERT INTO telegram_users (chat_id, user_id, username, first_name)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (chat_id) DO UPDATE SET user_id = EXCLUDED.user_id,
       username = EXCLUDED.username, first_name = EXCLUDED.first_name, linked_at = now()`,
    [chat.chatId, userId, chat.username ?? null, chat.firstName ?? null]
  );
  return userId;
}

/** Binds a Telegram chat directly to a user (used by the email/password login flow). */
export async function linkUserChat(
  userId: string,
  chat: { chatId: string; username?: string | null; firstName?: string | null }
): Promise<void> {
  await ensureTelegramSchema();
  await pool.query(
    `INSERT INTO telegram_users (chat_id, user_id, username, first_name)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (chat_id) DO UPDATE SET user_id = EXCLUDED.user_id,
       username = EXCLUDED.username, first_name = EXCLUDED.first_name, linked_at = now()`,
    [chat.chatId, userId, chat.username ?? null, chat.firstName ?? null]
  );
}

export async function getLinkedUserId(chatId: string): Promise<string | null> {
  await ensureTelegramSchema();
  const r = await pool.query(`SELECT user_id FROM telegram_users WHERE chat_id = $1`, [chatId]);
  return r.rows[0]?.user_id ?? null;
}

export async function getLinkedChatId(userId: string): Promise<string | null> {
  await ensureTelegramSchema();
  const r = await pool.query(`SELECT chat_id FROM telegram_users WHERE user_id = $1`, [userId]);
  return r.rows[0]?.chat_id ?? null;
}

/** Unlinks by chat (bot side) or by user (website side). */
export async function unlinkByChatId(chatId: string): Promise<void> {
  await ensureTelegramSchema();
  await pool.query(`DELETE FROM telegram_users WHERE chat_id = $1`, [chatId]);
  await clearState(chatId);
}

export async function unlinkByUserId(userId: string): Promise<void> {
  await ensureTelegramSchema();
  await pool.query(`DELETE FROM telegram_users WHERE user_id = $1`, [userId]);
}

/* ------------------------------------------------------------------ */
/* Admin linking                                                       */
/* ------------------------------------------------------------------ */

function normalizeUsername(username: string): string {
  return (username || "").trim().replace(/^@+/, "").toLowerCase();
}

/** Adds a Telegram username to the admin allowlist. Returns false if already present. */
export async function addAdminUsername(username: string, name?: string | null): Promise<boolean> {
  await ensureTelegramSchema();
  const clean = normalizeUsername(username);
  if (!clean) throw new Error("EMPTY_USERNAME");
  const res = await pool.query(
    `INSERT INTO telegram_admin_usernames (username, name) VALUES ($1, $2)
     ON CONFLICT (username) DO NOTHING`,
    [clean, name ?? null]
  );
  return (res.rowCount ?? 0) > 0;
}

export async function removeAdminUsername(username: string): Promise<void> {
  await ensureTelegramSchema();
  const clean = normalizeUsername(username);
  await pool.query(`DELETE FROM telegram_admin_usernames WHERE username = $1`, [clean]);
  // Also drop any active admin sessions bound to that username.
  await pool.query(`DELETE FROM telegram_admins WHERE lower(username) = $1`, [clean]);
}

export async function listAdminUsernames(): Promise<{ username: string; name: string | null; created_at: string }[]> {
  await ensureTelegramSchema();
  const r = await pool.query(
    `SELECT username, name, created_at FROM telegram_admin_usernames ORDER BY created_at ASC`
  );
  return r.rows;
}

/** True if the given Telegram username is on the admin allowlist. */
export async function isAdminUsername(username?: string | null): Promise<boolean> {
  if (!username) return false;
  await ensureTelegramSchema();
  const clean = normalizeUsername(username);
  if (!clean) return false;
  const r = await pool.query(`SELECT 1 FROM telegram_admin_usernames WHERE username = $1`, [clean]);
  return r.rows.length > 0;
}

/** Marks a chat as currently acting in admin mode (username already verified). */
export async function enterAdminMode(chatId: string, username: string | null, name: string | null): Promise<void> {
  await ensureTelegramSchema();
  await pool.query(
    `INSERT INTO telegram_admins (chat_id, username, name)
     VALUES ($1, $2, $3)
     ON CONFLICT (chat_id) DO UPDATE SET username = EXCLUDED.username, name = EXCLUDED.name, linked_at = now()`,
    [chatId, username ? normalizeUsername(username) : null, name]
  );
}

/** Returns the active admin session for a chat, if any. */
export async function getAdminSession(chatId: string): Promise<{ username: string | null; name: string | null } | null> {
  await ensureTelegramSchema();
  const r = await pool.query(`SELECT username, name FROM telegram_admins WHERE chat_id = $1`, [chatId]);
  if (r.rows.length === 0) return null;
  return { username: r.rows[0].username, name: r.rows[0].name };
}

export async function exitAdminMode(chatId: string): Promise<void> {
  await ensureTelegramSchema();
  await pool.query(`DELETE FROM telegram_admins WHERE chat_id = $1`, [chatId]);
}

/** Full logout: drops customer link, admin session and any transient state. */
export async function logoutChat(chatId: string): Promise<void> {
  await ensureTelegramSchema();
  await pool.query(`DELETE FROM telegram_users WHERE chat_id = $1`, [chatId]);
  await pool.query(`DELETE FROM telegram_admins WHERE chat_id = $1`, [chatId]);
  await pool.query(`DELETE FROM telegram_state WHERE chat_id = $1`, [chatId]);
}

/* ------------------------------------------------------------------ */
/* Conversation state                                                  */
/* ------------------------------------------------------------------ */

export interface ChatState {
  mode: string;
  data: Record<string, unknown>;
}

export async function getState(chatId: string): Promise<ChatState | null> {
  await ensureTelegramSchema();
  const r = await pool.query(`SELECT mode, data FROM telegram_state WHERE chat_id = $1`, [chatId]);
  if (r.rows.length === 0 || !r.rows[0].mode) return null;
  return { mode: r.rows[0].mode, data: r.rows[0].data || {} };
}

export async function setState(chatId: string, mode: string, data: Record<string, unknown> = {}): Promise<void> {
  await ensureTelegramSchema();
  await pool.query(
    `INSERT INTO telegram_state (chat_id, mode, data, updated_at)
     VALUES ($1, $2, $3::jsonb, now())
     ON CONFLICT (chat_id) DO UPDATE SET mode = EXCLUDED.mode, data = EXCLUDED.data, updated_at = now()`,
    [chatId, mode, JSON.stringify(data)]
  );
}

export async function clearState(chatId: string): Promise<void> {
  await ensureTelegramSchema();
  await pool.query(`DELETE FROM telegram_state WHERE chat_id = $1`, [chatId]);
}
