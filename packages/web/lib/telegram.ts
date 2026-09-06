import pool from "@/lib/db";
import { chatUnreadCount } from "@/lib/support";

/**
 * Thin Telegram Bot API client + helpers for the eSIM4U bot.
 *
 * The bot runs entirely on our existing Vercel backend via a webhook — there is
 * no long-polling process. Every call here is a plain HTTPS request to the
 * Telegram Bot API, so it works inside a serverless function.
 *
 * The bot token is ALWAYS read from the environment (never hardcoded), so it can
 * be rotated in Vercel without a code change.
 */

const API_BASE = "https://api.telegram.org";

export function getBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");
  return token;
}

/** True when a token is configured — lets callers skip Telegram work silently. */
export function telegramEnabled(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN);
}

/** Canonical public URL of the app (used for Mini App / deep links). */
export function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://esim4u.uk").replace(/\/$/, "");
}

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface TgUser {
  id: number;
  is_bot: boolean;
  first_name?: string;
  last_name?: string;
  username?: string;
}

export interface TgChat {
  id: number;
  type: string;
}

export interface TgContact {
  phone_number: string;
  first_name?: string;
  last_name?: string;
  user_id?: number;
}

export interface TgMessage {
  message_id: number;
  from?: TgUser;
  chat: TgChat;
  date: number;
  text?: string;
  photo?: unknown[];
  caption?: string;
  contact?: TgContact;
}

export interface TgCallbackQuery {
  id: string;
  from: TgUser;
  message?: TgMessage;
  data?: string;
}

export interface TgUpdate {
  update_id: number;
  message?: TgMessage;
  edited_message?: TgMessage;
  callback_query?: TgCallbackQuery;
}

export interface InlineButton {
  text: string;
  callback_data?: string;
  url?: string;
  web_app?: { url: string };
}

export type InlineKeyboard = InlineButton[][];

/* ------------------------------------------------------------------ */
/* Core request                                                        */
/* ------------------------------------------------------------------ */

interface TgResponse<T = unknown> {
  ok: boolean;
  result?: T;
  description?: string;
  error_code?: number;
}

/** Calls a Telegram Bot API method with a JSON body. Never throws on API errors. */
export async function tgCall<T = unknown>(method: string, payload: Record<string, unknown> = {}): Promise<TgResponse<T>> {
  try {
    const res = await fetch(`${API_BASE}/bot${getBotToken()}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = (await res.json()) as TgResponse<T>;
    if (!json.ok) {
      console.error(`Telegram ${method} failed:`, json.description);
    }
    return json;
  } catch (e) {
    console.error(`Telegram ${method} error:`, e instanceof Error ? e.message : e);
    return { ok: false, description: e instanceof Error ? e.message : "request failed" };
  }
}

/* ------------------------------------------------------------------ */
/* Text helpers                                                        */
/* ------------------------------------------------------------------ */

/** Escapes user/text content for Telegram HTML parse mode. */
export function esc(text: unknown): string {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

interface SendOpts {
  keyboard?: InlineKeyboard;
  disablePreview?: boolean;
  /** Raw reply_markup override (e.g. a reply keyboard or remove_keyboard). */
  replyMarkup?: Record<string, unknown>;
}

export async function sendMessage(chatId: number | string, text: string, opts: SendOpts = {}) {
  const replyMarkup = opts.replyMarkup ?? (opts.keyboard ? { inline_keyboard: opts.keyboard } : undefined);
  return tgCall("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: opts.disablePreview ?? true,
    reply_markup: replyMarkup,
  });
}

/** Prompts the user to share their phone number via a one-tap reply keyboard. */
export async function requestContact(chatId: number | string, text: string) {
  return sendMessage(chatId, text, {
    replyMarkup: {
      keyboard: [[{ text: "📱 Share my phone number", request_contact: true }]],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  });
}

/** Removes any custom reply keyboard. */
export async function removeKeyboard(chatId: number | string, text: string) {
  return sendMessage(chatId, text, { replyMarkup: { remove_keyboard: true } });
}

export async function editMessageText(
  chatId: number | string,
  messageId: number,
  text: string,
  opts: SendOpts = {}
) {
  return tgCall("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: opts.disablePreview ?? true,
    reply_markup: opts.keyboard ? { inline_keyboard: opts.keyboard } : undefined,
  });
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string, alert = false) {
  return tgCall("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
    show_alert: alert,
  });
}

export async function sendChatAction(chatId: number | string, action = "typing") {
  return tgCall("sendChatAction", { chat_id: chatId, action });
}

/** Deletes a message (used to wipe a password a user typed into the chat). */
export async function deleteMessage(chatId: number | string, messageId: number) {
  return tgCall("deleteMessage", { chat_id: chatId, message_id: messageId });
}

export interface BotCommand {
  command: string;
  description: string;
}

/** Slash commands shown to a regular customer. */
export const CUSTOMER_COMMANDS: BotCommand[] = [
  { command: "start", description: "Main menu" },
  { command: "link", description: "Link your eSIM4U account" },
  { command: "support", description: "Chat with support" },
  { command: "cancel", description: "Leave the current step" },
  { command: "logout", description: "Disconnect this Telegram" },
  { command: "help", description: "How to use the bot" },
];

/** Slash commands shown to a signed-in admin. */
export const ADMIN_COMMANDS: BotCommand[] = [
  { command: "admin", description: "Admin bridge menu" },
  { command: "broadcast", description: "Send a message to all users" },
  { command: "cancel", description: "Leave the current step" },
  { command: "logout", description: "Sign out of admin" },
  { command: "help", description: "How to use the bot" },
];

/** Sets the slash-command list for one specific chat (role-aware menus). */
export async function setChatCommands(chatId: number | string, commands: BotCommand[]) {
  return tgCall("setMyCommands", { commands, scope: { type: "chat", chat_id: chatId } });
}

/** Clears a chat's custom command list so it falls back to the global default. */
export async function deleteChatCommands(chatId: number | string) {
  return tgCall("deleteMyCommands", { scope: { type: "chat", chat_id: chatId } });
}

/**
 * Sends a photo. Accepts either an https/file_id string or a Buffer (uploaded as
 * multipart). Falls back to a plain text message if the upload fails.
 */
export async function sendPhoto(
  chatId: number | string,
  photo: string | Buffer,
  caption: string,
  opts: SendOpts = {}
): Promise<TgResponse> {
  const replyMarkup = opts.keyboard ? { inline_keyboard: opts.keyboard } : undefined;

  if (typeof photo === "string") {
    return tgCall("sendPhoto", {
      chat_id: chatId,
      photo,
      caption,
      parse_mode: "HTML",
      reply_markup: replyMarkup,
    });
  }

  // Buffer → multipart upload.
  try {
    const form = new FormData();
    form.append("chat_id", String(chatId));
    form.append("caption", caption);
    form.append("parse_mode", "HTML");
    if (replyMarkup) form.append("reply_markup", JSON.stringify(replyMarkup));
    const blob = new Blob([new Uint8Array(photo)], { type: "image/png" });
    form.append("photo", blob, "esim-qr.png");

    const res = await fetch(`${API_BASE}/bot${getBotToken()}/sendPhoto`, { method: "POST", body: form });
    const json = (await res.json()) as TgResponse;
    if (!json.ok) console.error("Telegram sendPhoto (upload) failed:", json.description);
    return json;
  } catch (e) {
    console.error("Telegram sendPhoto (upload) error:", e instanceof Error ? e.message : e);
    return { ok: false };
  }
}

/** Converts a `data:image/...;base64,....` URI into a Buffer, or null. */
export function dataUriToBuffer(dataUri: string | null | undefined): Buffer | null {
  if (!dataUri) return null;
  const m = /^data:[^;]+;base64,(.*)$/.exec(dataUri);
  if (!m) return null;
  try {
    return Buffer.from(m[1], "base64");
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Delivery: push a fulfilled eSIM to a linked customer                */
/* ------------------------------------------------------------------ */

interface DeliveryOrder {
  order_reference?: string | null;
  bundle_name?: string | null;
  country?: string | null;
  data_amount?: string | null;
  validity?: string | null;
  [key: string]: unknown;
}

interface DeliveryAssignment {
  iccid: string | null;
  qrCodeUrl: string | null; // data-URI PNG
  activationCode: string | null; // LPA string
  smdpAddress: string | null;
  matchingId: string | null;
  activationOtp: string | null;
}

/**
 * Sends the eSIM QR + activation details to a customer's linked Telegram, if any.
 * Best-effort: never throws, so it can't break order fulfilment. Called from the
 * fulfilment choke point alongside the branded email.
 */
export async function sendEsimToTelegram(
  userId: string,
  order: DeliveryOrder,
  a: DeliveryAssignment
): Promise<void> {
  if (!telegramEnabled()) return;
  try {
    const linked = await pool.query<{ chat_id: string }>(
      `SELECT chat_id FROM telegram_users WHERE user_id = $1`,
      [userId]
    );
    if (linked.rows.length === 0) return;
    const chatId = linked.rows[0].chat_id;

    const isTopup = Boolean(order.previous_order_reference);
    const title = isTopup ? "🔄 <b>Top-up ready!</b>" : "🎉 <b>Your eSIM is ready!</b>";
    const lines: string[] = [
      title,
      "",
      `<b>Plan:</b> ${esc(order.bundle_name || order.country || "eSIM Plan")}`,
    ];
    if (order.data_amount) lines.push(`<b>Data:</b> ${esc(order.data_amount)}`);
    if (order.validity) lines.push(`<b>Validity:</b> ${esc(order.validity)}`);
    if (order.order_reference) lines.push(`<b>Order:</b> <code>${esc(order.order_reference)}</code>`);
    lines.push("");

    if (a.activationCode) {
      lines.push("<b>Manual activation</b>");
      if (a.smdpAddress) lines.push(`SM-DP+: <code>${esc(a.smdpAddress)}</code>`);
      if (a.matchingId) lines.push(`Activation code: <code>${esc(a.matchingId)}</code>`);
      lines.push(`LPA: <code>${esc(a.activationCode)}</code>`);
      if (a.activationOtp) lines.push(`OTP: <code>${esc(a.activationOtp)}</code>`);
    }
    if (a.iccid) lines.push(`<b>ICCID:</b> <code>${esc(a.iccid)}</code>`);
    lines.push("");
    lines.push("📷 Scan the QR above in your phone's eSIM settings to install.");

    const caption = lines.join("\n");
    const keyboard: InlineKeyboard = [
      [{ text: "📱 View in app", web_app: { url: `${appUrl()}/dashboard/esims` } }],
    ];

    const qrBuffer = dataUriToBuffer(a.qrCodeUrl);
    if (qrBuffer) {
      await sendPhoto(chatId, qrBuffer, caption, { keyboard });
    } else {
      await sendMessage(chatId, caption, { keyboard });
    }
  } catch (e) {
    console.error("sendEsimToTelegram failed:", e instanceof Error ? e.message : e);
  }
}

/**
 * Notifies admins in Telegram when a customer sends a support message:
 *  - An admin who is actively live-chatting THIS customer gets the message
 *    inline (the conversation flows both ways, no separate ping).
 *  - An admin who is busy replying to a DIFFERENT customer is left undisturbed.
 *  - Any other admin (at the menu, idle, or away from the bot) gets a concise
 *    notification with the unread count and a button to jump straight in.
 * Best-effort. Called whenever a customer sends a message (website or Telegram).
 */
export async function notifyAdminsOfCustomerMessage(userId: string, senderName: string | null, body: string): Promise<void> {
  if (!telegramEnabled()) return;
  const text = (body || "").trim();
  if (!text) return;
  try {
    // All admin chats, with their current bot state (if any).
    const admins = await pool.query<{ chat_id: string; mode: string | null; target: string | null }>(
      `SELECT a.chat_id, s.mode, s.data->>'target' AS target
       FROM telegram_admins a
       LEFT JOIN telegram_state s ON s.chat_id = a.chat_id`
    );
    if (admins.rows.length === 0) return;

    const name = senderName || "Customer";
    let unread = 0;
    try {
      unread = await chatUnreadCount(userId, "admin");
    } catch {
      unread = 0;
    }

    for (const a of admins.rows) {
      const inChatWithThisUser = a.mode === "admin_chat" && a.target === userId;
      const busyElsewhere = a.mode === "admin_chat" && a.target !== userId;

      if (inChatWithThisUser) {
        // Live, inline — no interruption.
        await sendMessage(a.chat_id, `👤 <b>${esc(name)}</b>: ${esc(text)}`);
      } else if (busyElsewhere) {
        // Don't disturb an admin mid-reply to someone else.
        continue;
      } else {
        const count = unread > 0 ? ` · <b>${unread}</b> unread` : "";
        await sendMessage(
          a.chat_id,
          `📩 <b>New message from ${esc(name)}</b>${count}\n\n${esc(text)}`,
          { keyboard: [[{ text: "💬 Open chat", callback_data: `adm:conv:${userId}` }]] }
        );
      }
    }
  } catch (e) {
    console.error("notifyAdminsOfCustomerMessage failed:", e instanceof Error ? e.message : e);
  }
}

/**
 * Pushes a support reply to the customer's linked Telegram, if any. Always shown
 * as "Admin" — the replying staff member's identity is never revealed to the
 * customer. Best-effort. Called after any admin reply (dashboard or bot).
 */
export async function sendSupportReplyToTelegram(userId: string, body: string): Promise<void> {
  if (!telegramEnabled()) return;
  const text = (body || "").trim();
  if (!text) return;
  try {
    const linked = await pool.query<{ chat_id: string }>(
      `SELECT chat_id FROM telegram_users WHERE user_id = $1`,
      [userId]
    );
    if (linked.rows.length === 0) return;
    const chatId = linked.rows[0].chat_id;
    await sendMessage(chatId, `💬 <b>Admin</b> replied:\n\n${esc(text)}\n\n<i>Reply here to continue the conversation.</i>`);
  } catch (e) {
    console.error("sendSupportReplyToTelegram failed:", e instanceof Error ? e.message : e);
  }
}
