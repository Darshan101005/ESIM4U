import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, getAdminCookieName } from "@/lib/admin-auth";
import { tgCall, appUrl, telegramEnabled } from "@/lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Admin-only endpoint to register the Telegram webhook and configure the bot
 * (menu button that opens the Mini App + slash command list).
 *
 * POST /api/telegram/setup  → registers everything, returns the result.
 * GET  /api/telegram/setup  → returns current webhook info (for diagnostics).
 *
 * Requires:
 *   TELEGRAM_BOT_TOKEN       — the bot token (never hardcoded)
 *   TELEGRAM_WEBHOOK_SECRET  — a random string; verified on every webhook call
 *   NEXT_PUBLIC_APP_URL      — the public app URL (e.g. https://esim4u.uk)
 */

function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(getAdminCookieName())?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

export async function GET(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!telegramEnabled()) return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN not set" }, { status: 400 });

  const info = await tgCall("getWebhookInfo");
  const me = await tgCall("getMe");
  return NextResponse.json({ webhook: info.result, bot: me.result });
}

export async function POST(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "super_admin") {
    return NextResponse.json({ error: "Only a super admin can configure the bot" }, { status: 403 });
  }
  if (!telegramEnabled()) return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN not set" }, { status: 400 });

  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "TELEGRAM_WEBHOOK_SECRET not set" }, { status: 400 });
  }

  const base = appUrl();
  const webhookUrl = `${base}/api/telegram/webhook`;

  // 1. Register the webhook with the secret token.
  const setWebhook = await tgCall("setWebhook", {
    url: webhookUrl,
    secret_token: secret,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: true,
  });

  // 2. Menu button that opens the Mini App (the whole site) inside Telegram.
  const menuButton = await tgCall("setChatMenuButton", {
    menu_button: {
      type: "web_app",
      text: "Open App",
      web_app: { url: base },
    },
  });

  // 3. Slash command list shown in the Telegram UI.
  const commands = await tgCall("setMyCommands", {
    commands: [
      { command: "start", description: "Main menu" },
      { command: "link", description: "Link your eSIM4U account" },
      { command: "support", description: "Chat with support" },
      { command: "cancel", description: "Leave the current step" },
      { command: "logout", description: "Disconnect this Telegram" },
      { command: "help", description: "How to use the bot" },
    ],
  });

  return NextResponse.json({
    ok: setWebhook.ok && menuButton.ok && commands.ok,
    webhookUrl,
    setWebhook: { ok: setWebhook.ok, description: setWebhook.description },
    menuButton: { ok: menuButton.ok, description: menuButton.description },
    commands: { ok: commands.ok, description: commands.description },
  });
}
