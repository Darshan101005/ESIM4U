import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "@/lib/db";

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || "fallback-admin-secret";
const ADMIN_TOKEN_EXPIRY = "7d";
const ADMIN_COOKIE_NAME = "esim4u_admin_token";

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

export async function verifyAdminCredentials(email: string, password: string): Promise<AdminUser | null> {
  const result = await pool.query(
    `SELECT id, email, name, password_hash, created_at FROM admin_users WHERE email = $1`,
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
    created_at: admin.created_at,
  };
}

export function generateAdminToken(admin: AdminUser): string {
  return jwt.sign(
    { id: admin.id, email: admin.email, name: admin.name, role: "admin" },
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
      created_at: "",
    };
  } catch {
    return null;
  }
}

export function getAdminCookieName(): string {
  return ADMIN_COOKIE_NAME;
}

export async function createAdminUser(email: string, password: string, name: string): Promise<AdminUser> {
  const hash = await bcrypt.hash(password, 12);

  const existing = await pool.query(
    `SELECT id FROM admin_users WHERE email = $1`,
    [email]
  );

  if (existing.rows.length > 0) {
    throw new Error("Admin user already exists");
  }

  const result = await pool.query(
    `INSERT INTO admin_users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at`,
    [email, hash, name]
  );

  return result.rows[0];
}
