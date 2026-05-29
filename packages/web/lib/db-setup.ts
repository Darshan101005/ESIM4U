import pool from "@/lib/db";

export async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS email_otp (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      otp_hash VARCHAR(64) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      used BOOLEAN DEFAULT FALSE
    )
  `);

  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_email_otp_email ON email_otp(email)`
  );

  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_email_otp_expires ON email_otp(expires_at)`
  );
}
