import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import pool from "@/lib/db";

let profileColumnsReady = false;

/** Adds the newer personal-detail columns to user_profiles. Idempotent + cached. */
async function ensureProfileColumns() {
  if (profileColumnsReady) return;
  await pool.query(`
    ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
    ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
    ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;
  `);
  profileColumnsReady = true;
}

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session;
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureProfileColumns();

    // Heartbeat: the dashboard fetches this on load, so it's a reliable signal
    // that the customer is active right now — keeps "last seen" accurate.
    await pool.query(
      `INSERT INTO user_profiles (user_id, last_seen_at, updated_at)
       VALUES ($1, now(), now())
       ON CONFLICT (user_id) DO UPDATE SET last_seen_at = now(), updated_at = now()`,
      [session.user.id]
    );

    const result = await pool.query(
      `SELECT phone, preferred_currency, country, date_of_birth, gender FROM user_profiles WHERE user_id = $1`,
      [session.user.id]
    );

    const profile = result.rows[0] || {
      phone: null,
      preferred_currency: "USD",
      country: null,
      date_of_birth: null,
      gender: null,
    };

    return NextResponse.json({
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        createdAt: session.user.createdAt,
      },
      profile,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureProfileColumns();
    const body = await request.json();
    const { phone, preferred_currency, country, date_of_birth, gender } = body;

    // Partial update: only overwrite the fields that were actually provided, so
    // saving currency alone doesn't wipe personal details (and vice-versa).
    await pool.query(
      `INSERT INTO user_profiles (user_id, phone, preferred_currency, country, date_of_birth, gender, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         phone = COALESCE($2, user_profiles.phone),
         preferred_currency = COALESCE($3, user_profiles.preferred_currency),
         country = COALESCE($4, user_profiles.country),
         date_of_birth = COALESCE($5, user_profiles.date_of_birth),
         gender = COALESCE($6, user_profiles.gender),
         updated_at = NOW()`,
      [
        session.user.id,
        phone ?? null,
        preferred_currency ?? null,
        country ?? null,
        date_of_birth ?? null,
        gender ?? null,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
