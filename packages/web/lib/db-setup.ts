import pool from "@/lib/db";

async function resetSequenceIfEmpty(tableName: string) {
  const result = await pool.query(
    `SELECT COUNT(*) as count FROM "${tableName}"`
  );
  if (parseInt(result.rows[0].count) === 0) {
    try {
      await pool.query(`ALTER SEQUENCE ${tableName}_id_seq RESTART WITH 1`);
    } catch {}
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

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_email_otp_email ON email_otp(email)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_email_otp_expires ON email_otp(expires_at)`);

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

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_activity_log_event_type ON activity_log(event_type)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_activity_log_email ON activity_log(email)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at)`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(100) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_email VARCHAR(255) NOT NULL,
      bundle_code VARCHAR(100) NOT NULL,
      bundle_name VARCHAR(255),
      country VARCHAR(100),
      country_code VARCHAR(10),
      data_amount VARCHAR(50),
      validity VARCHAR(50),
      price DECIMAL(10,2) NOT NULL,
      currency VARCHAR(10) DEFAULT 'USD',
      order_reference VARCHAR(100) UNIQUE NOT NULL,
      monty_order_id VARCHAR(100),
      iccid VARCHAR(100),
      qr_code_url TEXT,
      lpa_code TEXT,
      cost_price DECIMAL(10,2),
      smdp_address TEXT,
      matching_id TEXT,
      activation_otp TEXT,
      bundle_expiry_date TEXT,
      status VARCHAR(30) DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2)`);
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS smdp_address TEXT`);
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS matching_id TEXT`);
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS activation_otp TEXT`);
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS bundle_expiry_date TEXT`);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_orders_user_email ON orders(user_email)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_orders_order_reference ON orders(order_reference)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS pricing_rules (
      id SERIAL PRIMARY KEY,
      scope_type VARCHAR(20) NOT NULL,
      scope_code VARCHAR(20) NOT NULL,
      markup_type VARCHAR(10) NOT NULL DEFAULT 'percent',
      markup_value DECIMAL(10,2) NOT NULL DEFAULT 0,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE (scope_type, scope_code)
    )
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_pricing_rules_scope ON pricing_rules(scope_type, scope_code)`);

  await pool.query(`
    INSERT INTO pricing_rules (scope_type, scope_code, markup_type, markup_value)
    VALUES ('global', 'GLOBAL', 'percent', 0)
    ON CONFLICT (scope_type, scope_code) DO NOTHING
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cart_items (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      bundle_code VARCHAR(100) NOT NULL,
      bundle_name VARCHAR(255),
      country VARCHAR(100),
      country_code VARCHAR(10),
      data_amount VARCHAR(50),
      validity VARCHAR(50),
      price DECIMAL(10,2) NOT NULL,
      cost_price DECIMAL(10,2),
      currency VARCHAR(10) DEFAULT 'USD',
      added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  await pool.query(`ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id)`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      id SERIAL PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      phone VARCHAR(20),
      preferred_currency VARCHAR(10) DEFAULT 'USD',
      country VARCHAR(100),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id)`);

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

  const triggers = [
    { name: "trg_reset_email_otp_seq", table: "email_otp", fn: "reset_serial_on_empty", event: "DELETE" },
    { name: "trg_truncate_email_otp_seq", table: "email_otp", fn: "reset_serial_on_truncate", event: "TRUNCATE" },
    { name: "trg_reset_activity_log_seq", table: "activity_log", fn: "reset_serial_on_empty", event: "DELETE" },
    { name: "trg_truncate_activity_log_seq", table: "activity_log", fn: "reset_serial_on_truncate", event: "TRUNCATE" },
  ];

  for (const t of triggers) {
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = '${t.name}') THEN
          CREATE TRIGGER ${t.name} AFTER ${t.event} ON ${t.table} FOR EACH STATEMENT EXECUTE FUNCTION ${t.fn}();
        END IF;
      END $$
    `);
  }

  await resetSequenceIfEmpty("email_otp");
  await resetSequenceIfEmpty("activity_log");
}
