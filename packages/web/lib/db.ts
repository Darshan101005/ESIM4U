import { Pool } from "pg";

declare global {
  var __esim4uPool: Pool | undefined;
}

function createPool() {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
    allowExitOnIdle: true,
  });
}

const pool = global.__esim4uPool || createPool();

if (process.env.NODE_ENV !== "production") {
  global.__esim4uPool = pool;
}

export default pool;
