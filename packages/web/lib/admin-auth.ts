import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "@/lib/db";

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || "fallback-admin-secret";
const ADMIN_TOKEN_EXPIRY = "7d";
const ADMIN_COOKIE_NAME = "esim4u_admin_token";

export type AdminRole = "super_admin" | "admin";

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: AdminRole;
  is_active?: boolean;
  created_at: string;
}

let adminColumnsReady = false;

export async function ensureAdminColumns(): Promise<void> {
  if (adminColumnsReady) return;
  await pool.query(`
    ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'admin';
    ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
  `);
  adminColumnsReady = true;
}

function normalizeRole(role: unknown): AdminRole {
  return role === "super_admin" ? "super_admin" : "admin";
}

export async function verifyAdminCredentials(email: string, password: string): Promise<AdminUser | null> {
  await ensureAdminColumns();
  const result = await pool.query(
    `SELECT id, email, name, password_hash, role, is_active, created_at FROM admin_users WHERE email = $1`,
    [email]
  );

  if (result.rows.length === 0) return null;

  const admin = result.rows[0];
  const isValid = await bcrypt.compare(password, admin.password_hash);

  if (!isValid) return null;

  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: normalizeRole(admin.role),
    is_active: admin.is_active !== false,
    created_at: admin.created_at,
  };
}

export function generateAdminToken(admin: AdminUser): string {
  return jwt.sign(
    { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
    ADMIN_JWT_SECRET,
    { expiresIn: ADMIN_TOKEN_EXPIRY }
  );
}

export function verifyAdminToken(token: string): AdminUser | null {
  try {
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET) as jwt.JwtPayload;
    return {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: normalizeRole(decoded.role),
      created_at: "",
    };
  } catch {
    return null;
  }
}

export function getAdminCookieName(): string {
  return ADMIN_COOKIE_NAME;
}

export async function createAdminUser(
  email: string,
  password: string,
  name: string,
  role: AdminRole = "admin"
): Promise<AdminUser> {
  await ensureAdminColumns();
  const hash = await bcrypt.hash(password, 12);

  const existing = await pool.query(`SELECT id FROM admin_users WHERE email = $1`, [email]);
  if (existing.rows.length > 0) {
    throw new Error("Admin user already exists");
  }

  const result = await pool.query(
    `INSERT INTO admin_users (email, password_hash, name, role, is_active) VALUES ($1, $2, $3, $4, true)
     RETURNING id, email, name, role, is_active, created_at`,
    [email, hash, name, role]
  );

  const row = result.rows[0];
  return { ...row, role: normalizeRole(row.role) };
}
