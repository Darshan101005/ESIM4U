import crypto from "crypto";
import pool from "@/lib/db";

function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

function hashOTP(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

export async function createOTP(email: string): Promise<string> {
  await pool.query(
    `UPDATE email_otp SET used = true WHERE email = $1 AND used = false`,
    [email]
  );

  const countResult = await pool.query(
    `SELECT COUNT(*) as count FROM email_otp WHERE email = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
    [email]
  );

  if (parseInt(countResult.rows[0].count) >= 3) {
    throw new Error("RATE_LIMIT_EXCEEDED");
  }

  const otp = generateOTP();
  const otpHash = hashOTP(otp);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await pool.query(
    `INSERT INTO email_otp (email, otp_hash, expires_at) VALUES ($1, $2, $3)`,
    [email, otpHash, expiresAt]
  );

  return otp;
}

export async function verifyOTP(
  email: string,
  otp: string
): Promise<boolean> {
  const otpHash = hashOTP(otp);

  const result = await pool.query(
    `SELECT id FROM email_otp WHERE email = $1 AND otp_hash = $2 AND used = false AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1`,
    [email, otpHash]
  );

  if (result.rows.length === 0) {
    return false;
  }

  await pool.query(`UPDATE email_otp SET used = true WHERE id = $1`, [
    result.rows[0].id,
  ]);

  return true;
}

export async function getRemainingResends(email: string): Promise<number> {
  const result = await pool.query(
    `SELECT COUNT(*) as count FROM email_otp WHERE email = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
    [email]
  );

  return Math.max(0, 3 - parseInt(result.rows[0].count));
}
