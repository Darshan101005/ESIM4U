import pool from "@/lib/db";

async function resetSequenceIfEmpty(tableName: string) {
  const result = await pool.query(
    `SELECT COUNT(*) as count FROM "${tableName}"`
  );
  if (parseInt(result.rows[0].count) === 0) {
    await pool.query(
      `ALTER SEQUENCE ${tableName}_id_seq RESTART WITH 1`
    );
  }
}

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

  await pool.query(`DROP TABLE IF EXISTS user_ip_info`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS activity_log (
      id SERIAL PRIMARY KEY,
      user_id TEXT,
      email VARCHAR(255),
      event_type VARCHAR(30) NOT NULL,
      ipv4 VARCHAR(45),
      ipv6 VARCHAR(45),
      continent VARCHAR(50),
      country VARCHAR(100),
      country_code VARCHAR(5),
      region VARCHAR(100),
      city VARCHAR(100),
      latitude DECIMAL(10,7),
      longitude DECIMAL(10,7),
      postal VARCHAR(20),
      calling_code VARCHAR(10),
      flag_img TEXT,
      flag_emoji VARCHAR(10),
      currency_code VARCHAR(5),
      timezone_id VARCHAR(50),
      timezone_utc VARCHAR(10),
      isp VARCHAR(200),
      org VARCHAR(200),
      is_vpn BOOLEAN,
      vpn_service VARCHAR(100),
      vpn_url TEXT,
      is_proxy BOOLEAN,
      is_tor BOOLEAN,
      is_datacenter BOOLEAN,
      is_mobile BOOLEAN,
      is_crawler BOOLEAN,
      is_abuser BOOLEAN,
      user_agent TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id)`
  );

  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_activity_log_event_type ON activity_log(event_type)`
  );

  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_activity_log_email ON activity_log(email)`
  );

  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at)`
  );

  await pool.query(`
    CREATE OR REPLACE FUNCTION reset_serial_on_empty()
    RETURNS TRIGGER AS $$
    DECLARE
      row_count INTEGER;
      seq_name TEXT;
    BEGIN
      EXECUTE format('SELECT COUNT(*) FROM %I', TG_TABLE_NAME) INTO row_count;
      IF row_count = 0 THEN
        seq_name := TG_TABLE_NAME || '_id_seq';
        EXECUTE format('ALTER SEQUENCE %I RESTART WITH 1', seq_name);
      END IF;
      RETURN NULL;
    END;
    $$ LANGUAGE plpgsql
  `);

  await pool.query(`
    CREATE OR REPLACE FUNCTION reset_serial_on_truncate()
    RETURNS TRIGGER AS $$
    DECLARE
      seq_name TEXT;
    BEGIN
      seq_name := TG_TABLE_NAME || '_id_seq';
      EXECUTE format('ALTER SEQUENCE %I RESTART WITH 1', seq_name);
      RETURN NULL;
    END;
    $$ LANGUAGE plpgsql
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_reset_email_otp_seq') THEN
        CREATE TRIGGER trg_reset_email_otp_seq AFTER DELETE ON email_otp FOR EACH STATEMENT EXECUTE FUNCTION reset_serial_on_empty();
      END IF;
    END $$
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_truncate_email_otp_seq') THEN
        CREATE TRIGGER trg_truncate_email_otp_seq AFTER TRUNCATE ON email_otp FOR EACH STATEMENT EXECUTE FUNCTION reset_serial_on_truncate();
      END IF;
    END $$
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_reset_activity_log_seq') THEN
        CREATE TRIGGER trg_reset_activity_log_seq AFTER DELETE ON activity_log FOR EACH STATEMENT EXECUTE FUNCTION reset_serial_on_empty();
      END IF;
    END $$
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_truncate_activity_log_seq') THEN
        CREATE TRIGGER trg_truncate_activity_log_seq AFTER TRUNCATE ON activity_log FOR EACH STATEMENT EXECUTE FUNCTION reset_serial_on_truncate();
      END IF;
    END $$
  `);

  await resetSequenceIfEmpty("email_otp");
  await resetSequenceIfEmpty("activity_log");
}
