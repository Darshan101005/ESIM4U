import pool from "@/lib/db";

let ready = false;

/**
 * Ensures the columns the admin CRM relies on exist:
 *  - Better Auth ban fields on the "user" table (block/unblock)
 *  - persistent personal + last-seen fields on user_profiles (last_seen_at
 *    survives the 7-day activity_log retention, so dormant/active segments work)
 * Idempotent + cached per process.
 */
export async function ensureUserAdminColumns(): Promise<void> {
  if (ready) return;
  await pool.query(`
    ALTER TABLE "user" ADD COLUMN IF NOT EXISTS banned BOOLEAN DEFAULT false;
    ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banReason" TEXT;
    ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banExpires" TIMESTAMPTZ;
    ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;
    ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
    ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
  `);
  ready = true;
}
