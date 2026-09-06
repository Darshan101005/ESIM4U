import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createLinkCode, getLinkedChatId, unlinkByUserId } from "@/lib/telegram-link";
import { telegramEnabled } from "@/lib/telegram";
import pool from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Customer-facing Telegram linking API (Profile → Connect Telegram).
 *
 * GET    → current link status { linked, username, botUsername, enabled }
 * POST   → generate a fresh 6-char link code { code, expiresAt, deepLink }
 * DELETE → unlink this account from Telegram
 */

async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

export async function GET() {
  const user = await requireUser();
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const chatId = await getLinkedChatId(user.id);
  let username: string | null = null;
  if (chatId) {
    const r = await pool.query(`SELECT username, first_name FROM telegram_users WHERE user_id = $1`, [user.id]);
    username = r.rows[0]?.username || r.rows[0]?.first_name || null;
  }
  return NextResponse.json({
    enabled: telegramEnabled(),
    linked: Boolean(chatId),
    username,
    botUsername: process.env.TELEGRAM_BOT_USERNAME || null,
  });
}

export async function POST() {
  const user = await requireUser();
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!telegramEnabled()) return NextResponse.json({ error: "Telegram is not configured" }, { status: 400 });

  const { code, expiresAt } = await createLinkCode(user.id);
  const botUsername = process.env.TELEGRAM_BOT_USERNAME;
  const deepLink = botUsername ? `https://t.me/${botUsername}?start=link_${code}` : null;
  return NextResponse.json({ code, expiresAt, deepLink, botUsername: botUsername || null });
}

export async function DELETE() {
  const user = await requireUser();
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await unlinkByUserId(user.id);
  return NextResponse.json({ ok: true });
}
