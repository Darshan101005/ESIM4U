import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  TgUpdate,
  TgMessage,
  TgCallbackQuery,
  InlineKeyboard,
  sendMessage,
  editMessageText,
  answerCallbackQuery,
  sendChatAction,
  sendSupportReplyToTelegram,
  notifyAdminsOfCustomerMessage,
  requestContact,
  removeKeyboard,
  setChatCommands,
  deleteChatCommands,
  CUSTOMER_COMMANDS,
  ADMIN_COMMANDS,
  deleteMessage,
  esc,
  appUrl,
  telegramEnabled,
} from "@/lib/telegram";
import { getSiteSettings } from "@/lib/site-settings";
import { isMaintenanceActive, formatMaintenanceWindow } from "@/lib/site-settings-types";
import {
  consumeLinkCode,
  linkUserChat,
  getLinkedUserId,
  unlinkByChatId,
  isAdminUsername,
  enterAdminMode,
  getAdminSession,
  exitAdminMode,
  logoutChat,
  getState,
  setState,
  clearState,
} from "@/lib/telegram-link";
import { getWalletBalanceUsd } from "@/lib/wallet";
import { getReferralBalanceUsd } from "@/lib/referral";
import { sendChatMessage, listConversations, listChatMessages } from "@/lib/support";
import { fetchConsumption } from "@/lib/montyesim";
import { getResellerWallet } from "@/lib/montyesim";
import { toMb, formatData } from "@/lib/data-units";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* Small data helpers                                                  */
/* ------------------------------------------------------------------ */

interface UserInfo {
  id: string;
  name: string | null;
  email: string;
  banned: boolean;
}

async function getUserInfo(userId: string): Promise<UserInfo | null> {
  const r = await pool.query(
    `SELECT id, name, email, COALESCE(banned, false) AS banned FROM "user" WHERE id = $1`,
    [userId]
  );
  return r.rows[0] || null;
}

async function findUserByEmail(email: string): Promise<UserInfo | null> {
  const r = await pool.query(
    `SELECT id, name, email, COALESCE(banned, false) AS banned FROM "user" WHERE lower(email) = lower($1)`,
    [email.trim()]
  );
  return r.rows[0] || null;
}

interface EsimRow {
  id: number;
  bundle_name: string | null;
  country: string | null;
  data_amount: string | null;
  validity: string | null;
  status: string;
  monty_order_id: string | null;
  order_reference: string | null;
  iccid: string | null;
  bundle_expiry_date: string | null;
  created_at: string;
}

async function listEsims(userId: string): Promise<EsimRow[]> {
  const r = await pool.query(
    `SELECT id, bundle_name, country, data_amount, validity, status, monty_order_id,
            order_reference, iccid, bundle_expiry_date, created_at
     FROM orders
     WHERE user_id = $1 AND deleted_scope IS DISTINCT FROM 'all'
       AND status = 'completed' AND monty_order_id IS NOT NULL
     ORDER BY created_at DESC LIMIT 20`,
    [userId]
  );
  return r.rows as EsimRow[];
}

async function getEsim(userId: string, orderId: number): Promise<EsimRow | null> {
  const r = await pool.query(
    `SELECT id, bundle_name, country, data_amount, validity, status, monty_order_id,
            order_reference, iccid, bundle_expiry_date, created_at
     FROM orders WHERE id = $1 AND user_id = $2`,
    [orderId, userId]
  );
  return (r.rows[0] as EsimRow) || null;
}

/* ------------------------------------------------------------------ */
/* Menus / views                                                       */
/* ------------------------------------------------------------------ */

function mainMenuKeyboard(linked: boolean): InlineKeyboard {
  const rows: InlineKeyboard = [[{ text: "🌐 Open eSIM4U App", web_app: { url: appUrl() } }]];
  if (linked) {
    rows.push([
      { text: "📱 My eSIMs", callback_data: "esims" },
      { text: "💰 Wallet", callback_data: "wallet" },
    ]);
    rows.push([
      { text: "📊 Data Usage", callback_data: "usage" },
      { text: "💬 Support", callback_data: "support" },
    ]);
    rows.push([{ text: "❓ Help", callback_data: "help" }]);
  } else {
    rows.push([{ text: "🔗 Link my account", callback_data: "link_help" }]);
    rows.push([{ text: "💬 Support", callback_data: "support" }, { text: "❓ Help", callback_data: "help" }]);
  }
  return rows;
}

async function mainMenuText(chatId: string): Promise<{ text: string; keyboard: InlineKeyboard }> {
  const userId = await getLinkedUserId(chatId);
  if (userId) {
    const info = await getUserInfo(userId);
    const name = info?.name ? info.name.split(" ")[0] : "there";
    return {
      text:
        `👋 Hi <b>${esc(name)}</b>! Welcome to <b>eSIM4U</b>.\n\n` +
        `Manage your eSIMs, wallet and support right here — or open the full app to browse and buy new plans.`,
      keyboard: mainMenuKeyboard(true),
    };
  }
  return {
    text:
      `👋 Welcome to <b>eSIM4U</b> — instant travel eSIMs for 190+ countries.\n\n` +
      `Open the app to browse and buy plans, or link your account to manage your eSIMs and wallet right here in Telegram.`,
    keyboard: mainMenuKeyboard(false),
  };
}

type TgFrom = { username?: string; first_name?: string } | undefined;

/** The role chooser shown to recognised admin usernames. */
function roleChooser(): { text: string; keyboard: InlineKeyboard } {
  return {
    text:
      `👋 You're recognised as an <b>admin</b>.\n\nHow would you like to continue?`,
    keyboard: [
      [{ text: "👤 Continue as customer", callback_data: "role:customer" }],
      [{ text: "🛠 Log in as admin", callback_data: "role:admin" }],
    ],
  };
}

/**
 * Decides what to show for /start (and as the default fallback):
 * - active admin session → admin menu
 * - recognised admin username with no customer link → role chooser
 * - otherwise → the normal customer menu
 */
async function showStart(chatId: string, from: TgFrom): Promise<void> {
  const session = await getAdminSession(chatId);
  if (session) {
    const m = adminMenu();
    await sendMessage(chatId, m.text, { keyboard: m.keyboard });
    return;
  }
  const linkedUser = await getLinkedUserId(chatId);
  if (!linkedUser && (await isAdminUsername(from?.username))) {
    const r = roleChooser();
    await sendMessage(chatId, r.text, { keyboard: r.keyboard });
    return;
  }
  const { text, keyboard } = await mainMenuText(chatId);
  await sendMessage(chatId, text, { keyboard });
}

const HELP_TEXT =
  `<b>eSIM4U Bot — Help</b>\n\n` +
  `• 🌐 <b>Open App</b> — browse & buy eSIMs inside Telegram\n` +
  `• 🔗 <b>Link account</b> — connect your eSIM4U account to see your eSIMs, wallet & usage\n` +
  `• 📱 <b>My eSIMs</b> — view your active eSIMs & QR codes\n` +
  `• 💰 <b>Wallet</b> — check your wallet & referral balance\n` +
  `• 📊 <b>Data Usage</b> — live data remaining per eSIM\n` +
  `• 💬 <b>Support</b> — chat with our support team\n\n` +
  `<b>Commands</b>\n` +
  `/start — main menu\n` +
  `/link — link your account (one-time code OR email & password)\n` +
  `/support — start a support chat\n` +
  `/cancel — leave the current step (e.g. a support chat)\n` +
  `/logout — disconnect this Telegram (lets someone else use it)\n` +
  `/help — this message\n\n` +
  `<b>Admin commands</b>\n` +
  `/admin — open the admin bridge (only for approved Telegram usernames)\n` +
  `/broadcast — send a message to all linked users\n` +
  `Admins are added by their Telegram @username in the admin panel — no password needed in the bot. ` +
  `Once signed in: live-chat support, look up customers, block/unblock, broadcast, and check the reseller wallet.`;

/** The link chooser: option 1 = one-time code, option 2 = email & password. */
function linkHelpText(): { text: string; keyboard: InlineKeyboard } {
  return {
    text:
      `🔗 <b>Link your eSIM4U account</b>\n\n` +
      `Choose how you'd like to connect:\n\n` +
      `<b>1️⃣ One-time code</b> — get a 6-character code from the app (Profile → Connect Telegram)\n` +
      `<b>2️⃣ Email &amp; password</b> — sign in with your website login here\n\n` +
      `Don't have an account yet? Open the app to sign up — it's free.`,
    keyboard: [
      [{ text: "1️⃣ Use a one-time code", callback_data: "link_code" }],
      [{ text: "2️⃣ Login with email & password", callback_data: "link_login" }],
      [{ text: "🌐 Open App", web_app: { url: `${appUrl()}/dashboard/profile` } }],
      [{ text: "⬅️ Back", callback_data: "menu" }],
    ],
  };
}

/** Instructions for the one-time code path. */
function linkCodeText(): { text: string; keyboard: InlineKeyboard } {
  return {
    text:
      `1️⃣ <b>Link with a one-time code</b>\n\n` +
      `1. Open the app and sign in\n` +
      `2. Go to <b>Profile → Connect Telegram</b>\n` +
      `3. Copy your 6-character code\n` +
      `4. Send it here as <code>/link YOURCODE</code>`,
    keyboard: [
      [{ text: "🌐 Open App & get code", web_app: { url: `${appUrl()}/dashboard/profile` } }],
      [{ text: "⬅️ Back", callback_data: "link_help" }],
    ],
  };
}

async function esimsView(userId: string): Promise<{ text: string; keyboard: InlineKeyboard }> {
  const esims = await listEsims(userId);
  if (esims.length === 0) {
    return {
      text: `📱 <b>My eSIMs</b>\n\nYou don't have any active eSIMs yet. Open the app to buy your first plan!`,
      keyboard: [
        [{ text: "🌐 Browse plans", web_app: { url: `${appUrl()}/esims` } }],
        [{ text: "⬅️ Back", callback_data: "menu" }],
      ],
    };
  }
  const rows: InlineKeyboard = esims.map((e) => [
    {
      text: `${e.bundle_name || e.country || "eSIM"} · ${e.data_amount || ""}`.trim(),
      callback_data: `esim:${e.id}`,
    },
  ]);
  rows.push([{ text: "⬅️ Back", callback_data: "menu" }]);
  return { text: `📱 <b>My eSIMs</b>\n\nSelect an eSIM to view its details and usage:`, keyboard: rows };
}

function esimDetailText(e: EsimRow): string {
  const lines = [
    `📱 <b>${esc(e.bundle_name || e.country || "eSIM")}</b>`,
    "",
  ];
  if (e.data_amount) lines.push(`<b>Data:</b> ${esc(e.data_amount)}`);
  if (e.validity) lines.push(`<b>Validity:</b> ${esc(e.validity)}`);
  if (e.order_reference) lines.push(`<b>Order:</b> <code>${esc(e.order_reference)}</code>`);
  if (e.iccid) lines.push(`<b>ICCID:</b> <code>${esc(e.iccid)}</code>`);
  if (e.bundle_expiry_date)
    lines.push(`<b>Expires:</b> ${esc(new Date(e.bundle_expiry_date).toLocaleDateString("en-GB"))}`);
  return lines.join("\n");
}

async function usageView(userId: string, orderId: number): Promise<{ text: string; keyboard: InlineKeyboard }> {
  const e = await getEsim(userId, orderId);
  if (!e || !e.monty_order_id) {
    return { text: `Couldn't find that eSIM.`, keyboard: [[{ text: "⬅️ Back", callback_data: "esims" }]] };
  }
  let text = `📊 <b>Data usage</b> — ${esc(e.bundle_name || e.country || "eSIM")}\n\n`;
  try {
    const c = await fetchConsumption(e.monty_order_id, e.order_reference || undefined);
    if (!c) {
      text += `No usage data available yet. It can take a few minutes after activation to appear.`;
    } else if (c.unlimited) {
      const usedMb = toMb(c.data_used, c.data_unit);
      text += `<b>Plan:</b> Unlimited\n<b>Used:</b> ${esc(formatData(usedMb, "GB"))}`;
      if (c.plan_status) text += `\n<b>Status:</b> ${esc(c.plan_status)}`;
    } else {
      const allocMb = toMb(c.data_allocated, c.data_unit);
      const usedMb = toMb(c.data_used, c.data_unit);
      const remMb = toMb(c.data_remaining, c.data_unit);
      text +=
        `<b>Total:</b> ${esc(formatData(allocMb, "GB"))}\n` +
        `<b>Used:</b> ${esc(formatData(usedMb, "GB"))}\n` +
        `<b>Remaining:</b> ${esc(formatData(remMb, "GB"))}`;
      if (c.plan_status) text += `\n<b>Status:</b> ${esc(c.plan_status)}`;
    }
    if (c && c.bundle_expiry_date)
      text += `\n<b>Expires:</b> ${esc(new Date(c.bundle_expiry_date).toLocaleDateString("en-GB"))}`;
  } catch {
    text += `Couldn't load usage right now. Please try again shortly.`;
  }
  return {
    text,
    keyboard: [
      [{ text: "🔄 Refresh", callback_data: `usage:${orderId}` }],
      [{ text: "⬅️ Back to eSIM", callback_data: `esim:${orderId}` }],
    ],
  };
}

async function walletView(userId: string): Promise<{ text: string; keyboard: InlineKeyboard }> {
  const [wallet, referral] = await Promise.all([getWalletBalanceUsd(userId), getReferralBalanceUsd(userId)]);
  return {
    text:
      `💰 <b>Your balances</b>\n\n` +
      `<b>Wallet:</b> $${wallet.toFixed(2)}\n` +
      `<b>Referral credit:</b> $${referral.toFixed(2)}\n\n` +
      `Top up your wallet or use referral credit at checkout in the app.`,
    keyboard: [
      [{ text: "💳 Top up wallet", web_app: { url: `${appUrl()}/dashboard/wallet` } }],
      [{ text: "⬅️ Back", callback_data: "menu" }],
    ],
  };
}

/* ------------------------------------------------------------------ */
/* Admin views                                                         */
/* ------------------------------------------------------------------ */

function adminMenu(): { text: string; keyboard: InlineKeyboard } {
  return {
    text: `🛠 <b>Admin bridge</b>\n\nWhat would you like to do?`,
    keyboard: [
      [{ text: "💬 Support conversations", callback_data: "adm:convos" }],
      [{ text: "🔎 Look up customer", callback_data: "adm:lookup" }],
      [{ text: "📢 Broadcast", callback_data: "adm:broadcast" }],
      [{ text: "🏦 Reseller wallet", callback_data: "adm:wallet" }],
      [{ text: "👤 Switch to customer", callback_data: "role:customer" }],
    ],
  };
}

async function adminConvosView(): Promise<{ text: string; keyboard: InlineKeyboard }> {
  const convos = await listConversations();
  if (convos.length === 0) {
    return {
      text: `💬 <b>Support conversations</b>\n\nNo conversations yet.`,
      keyboard: [[{ text: "⬅️ Back", callback_data: "adm:menu" }]],
    };
  }
  const top = convos.slice(0, 12);
  const rows: InlineKeyboard = top.map((c) => [
    {
      text: `${c.unread > 0 ? "🔴 " : ""}${c.customer_name || c.user_email || "Customer"}`,
      callback_data: `adm:conv:${c.user_id}`,
    },
  ]);
  rows.push([{ text: "⬅️ Back", callback_data: "adm:menu" }]);
  return { text: `💬 <b>Support conversations</b>\n\nTap a conversation to view & reply:`, keyboard: rows };
}

async function customerDetailView(userId: string): Promise<{ text: string; keyboard: InlineKeyboard }> {
  const info = await getUserInfo(userId);
  if (!info) {
    return { text: `Customer not found.`, keyboard: [[{ text: "⬅️ Back", callback_data: "adm:menu" }]] };
  }
  const [wallet, referral, esims] = await Promise.all([
    getWalletBalanceUsd(userId),
    getReferralBalanceUsd(userId),
    listEsims(userId),
  ]);
  const prof = await pool.query(
    `SELECT country, phone FROM user_profiles WHERE user_id = $1`,
    [userId]
  );
  const p = prof.rows[0] || {};
  const text =
    `👤 <b>${esc(info.name || "Customer")}</b>\n` +
    `<b>Email:</b> ${esc(info.email)}\n` +
    (p.phone ? `<b>Phone:</b> ${esc(p.phone)}\n` : "") +
    (p.country ? `<b>Country:</b> ${esc(p.country)}\n` : "") +
    `<b>Status:</b> ${info.banned ? "🚫 Blocked" : "✅ Active"}\n\n` +
    `<b>Wallet:</b> $${wallet.toFixed(2)}\n` +
    `<b>Referral credit:</b> $${referral.toFixed(2)}\n` +
    `<b>Active eSIMs:</b> ${esims.length}`;
  const rows: InlineKeyboard = [];
  if (info.banned) {
    rows.push([{ text: "✅ Unblock", callback_data: `adm:unblock:${userId}` }]);
  } else {
    rows.push([{ text: "🚫 Block", callback_data: `adm:block:${userId}` }]);
  }
  rows.push([{ text: "✍️ Reply in support", callback_data: `adm:reply:${userId}` }]);
  rows.push([{ text: "⬅️ Back", callback_data: "adm:menu" }]);
  return { text, keyboard: rows };
}

async function resellerWalletView(): Promise<{ text: string; keyboard: InlineKeyboard }> {
  try {
    const w = await getResellerWallet();
    const balance = w?.balance ?? w?.wallet_balance ?? "—";
    const currency = w?.currency_code ?? w?.currency ?? "";
    return {
      text: `🏦 <b>Reseller wallet</b>\n\n<b>Balance:</b> ${esc(balance)} ${esc(currency)}`,
      keyboard: [[{ text: "🔄 Refresh", callback_data: "adm:wallet" }], [{ text: "⬅️ Back", callback_data: "adm:menu" }]],
    };
  } catch {
    return {
      text: `🏦 <b>Reseller wallet</b>\n\nCouldn't load the balance right now.`,
      keyboard: [[{ text: "🔄 Retry", callback_data: "adm:wallet" }], [{ text: "⬅️ Back", callback_data: "adm:menu" }]],
    };
  }
}

async function blockCustomer(userId: string, block: boolean, adminName: string): Promise<void> {
  if (block) {
    await pool.query(
      `UPDATE "user" SET banned = true, "banReason" = $2, "banExpires" = NULL WHERE id = $1`,
      [userId, `Blocked by ${adminName} via Telegram`]
    );
    await pool.query(`DELETE FROM session WHERE "userId" = $1`, [userId]);
  } else {
    await pool.query(`UPDATE "user" SET banned = false, "banReason" = NULL WHERE id = $1`, [userId]);
  }
}

/* ------------------------------------------------------------------ */
/* Maintenance gate                                                    */
/* ------------------------------------------------------------------ */

const MAINTENANCE_ALLOWED = new Set(["/start", "/admin", "/cancel", "/logout", "/help"]);

/**
 * When bot maintenance is on, non-admins get a maintenance notice and are
 * blocked from features. Admins always pass through. Returns true if blocked.
 */
async function botBlockedForNonAdmin(chatId: string, from: TgFrom, cmd?: string): Promise<boolean> {
  let settings;
  try {
    settings = await getSiteSettings();
  } catch {
    return false;
  }
  const m = settings.maintenance;
  // Respect the optional schedule window (from/to).
  if (!isMaintenanceActive(Boolean(m?.bot), m?.from, m?.to)) return false;
  // Admins bypass entirely.
  if ((await getAdminSession(chatId)) || (await isAdminUsername(from?.username))) return false;
  // Let a few navigation commands through so nothing feels broken.
  if (cmd && MAINTENANCE_ALLOWED.has(cmd)) return false;
  const windowText = formatMaintenanceWindow(m.from, m.to);
  const schedule = windowText ? `\n\n🗓 <i>Scheduled ${esc(windowText)}</i>` : "";
  await sendMessage(chatId, `🛠 <b>Under maintenance</b>\n\n${esc(m.message)}${schedule}`);
  return true;
}

/* ------------------------------------------------------------------ */
/* Phone capture (via Telegram contact share)                          */
/* ------------------------------------------------------------------ */

/** Prompts a linked customer to share their phone number if we don't have one. */
async function maybeRequestPhone(chatId: string, userId: string): Promise<void> {
  try {
    const r = await pool.query(`SELECT phone FROM user_profiles WHERE user_id = $1`, [userId]);
    const phone = (r.rows[0]?.phone || "").trim();
    if (phone) return;
    await requestContact(
      chatId,
      `📱 One more thing — want to add your <b>phone number</b> to your account? ` +
        `Tap the button below to share it, or send /cancel to skip.`
    );
  } catch {
    // best-effort
  }
}

async function handleContact(chatId: string, msg: TgMessage): Promise<void> {
  const contact = msg.contact;
  const userId = await getLinkedUserId(chatId);
  if (!userId || !contact) {
    await removeKeyboard(chatId, `Thanks!`);
    return;
  }
  // Only accept the person's OWN contact (not a forwarded one).
  if (contact.user_id && msg.from?.id && contact.user_id !== msg.from.id) {
    await removeKeyboard(chatId, `Please share your own number using the button.`);
    return;
  }
  const phone = (contact.phone_number || "").trim();
  if (!phone) {
    await removeKeyboard(chatId, `Couldn't read that number.`);
    return;
  }
  const normalized = phone.startsWith("+") ? phone : `+${phone}`;
  try {
    await pool.query(
      `INSERT INTO user_profiles (user_id, phone, updated_at) VALUES ($1, $2, now())
       ON CONFLICT (user_id) DO UPDATE SET
         phone = COALESCE(NULLIF(user_profiles.phone, ''), EXCLUDED.phone), updated_at = now()`,
      [userId, normalized]
    );
    await removeKeyboard(chatId, `✅ Saved your number: <code>${esc(normalized)}</code>. You can update it anytime in your profile.`);
  } catch {
    await removeKeyboard(chatId, `Couldn't save your number right now.`);
  }
}

/* ------------------------------------------------------------------ */
/* Admin live chat (persistent, two-way)                               */
/* ------------------------------------------------------------------ */

/** The live-chat header + recent history shown when an admin opens a conversation. */
async function adminChatView(userId: string): Promise<{ text: string; keyboard: InlineKeyboard }> {
  const msgs = await listChatMessages(userId, "admin");
  const info = await getUserInfo(userId);
  const recent = msgs.slice(-8);
  let text = `💬 <b>Live chat — ${esc(info?.name || info?.email || "Customer")}</b>\n`;
  if (info?.email) text += `<i>${esc(info.email)}</i>\n`;
  text += `\n`;
  if (recent.length === 0) {
    text += `<i>No messages yet. Type to start.</i>`;
  } else {
    for (const m of recent) {
      const who = m.sender === "admin" ? "🟢 You" : "👤 Customer";
      const body = m.body || (m.attachments.length > 0 ? "📎 Attachment" : "");
      text += `${who}: ${esc(body)}\n`;
    }
  }
  text += `\n<i>Just type to reply — messages flow both ways live. Send /cancel or tap Leave to exit.</i>`;
  return {
    text,
    keyboard: [
      [{ text: "🔄 Refresh", callback_data: `adm:conv:${userId}` }, { text: "🔎 Details", callback_data: `adm:cust:${userId}` }],
      [{ text: "🚪 Leave chat", callback_data: "adm:convos" }],
    ],
  };
}

/** Sends an admin's typed message to the customer, staying in the live session. */
async function adminChatSend(chatId: string, targetUserId: string, text: string): Promise<void> {
  const admin = await getAdminSession(chatId);
  if (!admin) {
    await clearState(chatId);
    await sendMessage(chatId, `Your admin session ended. Send /admin to sign in again.`);
    return;
  }
  if (!text.trim()) return;
  try {
    await sendChatMessage({
      userId: targetUserId,
      sender: "admin",
      // Customer only ever sees "Admin" — never the staff member's name.
      senderName: "Admin",
      body: text,
    });
    // Deliver to the customer's Telegram too (if linked). No confirmation back
    // to the admin — the session stays open and uninterrupted.
    await sendSupportReplyToTelegram(targetUserId, text);
  } catch (e) {
    if (e instanceof Error && e.message === "EMPTY_MESSAGE") return;
    await sendMessage(chatId, `⚠️ Couldn't deliver that message. Try again.`);
  }
}

/* ------------------------------------------------------------------ */
/* Broadcast                                                           */
/* ------------------------------------------------------------------ */

const BROADCAST_TEMPLATES: { title: string; body: string }[] = [
  {
    title: "🎉 New plans available",
    body: "🎉 <b>New eSIM plans just landed!</b>\n\nFresh data plans for even more destinations are now live. Open the app to explore and travel connected.",
  },
  {
    title: "🔥 Limited-time sale",
    body: "🔥 <b>Limited-time offer!</b>\n\nGrab a discounted eSIM before the deal ends. Open the app to see today's prices.",
  },
  {
    title: "📢 Service update",
    body: "📢 <b>Service update</b>\n\nWe've made improvements to give you a smoother experience. Thanks for choosing eSIM4U!",
  },
  {
    title: "✈️ Travel tip",
    body: "✈️ <b>Travelling soon?</b>\n\nInstall your eSIM before you fly so you land connected — no roaming fees, no SIM swaps.",
  },
];

function broadcastMenu(): { text: string; keyboard: InlineKeyboard } {
  const rows: InlineKeyboard = BROADCAST_TEMPLATES.map((t, i) => [
    { text: t.title, callback_data: `adm:bc:${i}` },
  ]);
  rows.push([{ text: "✍️ Write a custom message", callback_data: "adm:bccustom" }]);
  rows.push([{ text: "⬅️ Back", callback_data: "adm:menu" }]);
  return {
    text: `📢 <b>Broadcast</b>\n\nSend a message to <b>everyone</b> who has linked Telegram. Pick a template or write your own:`,
    keyboard: rows,
  };
}

async function broadcastAudienceCount(): Promise<number> {
  const r = await pool.query(`SELECT COUNT(*)::int AS c FROM telegram_users`);
  return r.rows[0]?.c ?? 0;
}

/** Shows a confirm screen for the composed broadcast (template or custom). */
async function broadcastConfirm(chatId: string, body: string): Promise<{ text: string; keyboard: InlineKeyboard }> {
  const count = await broadcastAudienceCount();
  await setState(chatId, "broadcast_confirm", { body });
  return {
    text: `📢 <b>Preview</b>\n\n${body}\n\n———\nThis will be sent to <b>${count}</b> linked user${count === 1 ? "" : "s"}. Send it?`,
    keyboard: [
      [{ text: "✅ Send now", callback_data: "adm:bcgo" }],
      [{ text: "⬅️ Cancel", callback_data: "adm:broadcast" }],
    ],
  };
}

/** Custom-compose entry: the admin's next message becomes the broadcast. */
async function broadcastPreview(chatId: string, text: string): Promise<void> {
  const body = text.trim();
  if (!body) {
    await sendMessage(chatId, `Please type the message to broadcast, or /cancel.`);
    return;
  }
  const { text: t, keyboard } = await broadcastConfirm(chatId, esc(body));
  await sendMessage(chatId, t, { keyboard });
}

async function broadcastSend(chatId: string, body: string): Promise<void> {
  const r = await pool.query<{ chat_id: string }>(`SELECT chat_id FROM telegram_users`);
  let sent = 0;
  let failed = 0;
  for (const row of r.rows) {
    const res = await sendMessage(row.chat_id, body);
    if (res.ok) sent++;
    else failed++;
  }
  await clearState(chatId);
  await sendMessage(
    chatId,
    `✅ <b>Broadcast sent.</b>\nDelivered: ${sent}${failed ? ` · Failed: ${failed}` : ""}`,
    { keyboard: [[{ text: "⬅️ Admin menu", callback_data: "adm:menu" }]] }
  );
}

/* ------------------------------------------------------------------ */
/* Webhook entry                                                       */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  // Verify the secret token set during setWebhook (defence against spoofed calls).
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (expected) {
    const got = request.headers.get("x-telegram-bot-api-secret-token");
    if (got !== expected) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  if (!telegramEnabled()) {
    // Acknowledge so Telegram doesn't retry, but do nothing.
    return NextResponse.json({ ok: true });
  }

  let update: TgUpdate;
  try {
    update = (await request.json()) as TgUpdate;
  } catch {
    return NextResponse.json({ ok: true });
  }

  try {
    if (update.callback_query) {
      await handleCallback(update.callback_query);
    } else if (update.message) {
      await handleMessage(update.message);
    }
  } catch (e) {
    console.error("Telegram webhook handler error:", e instanceof Error ? e.message : e);
  }

  // Always 200 so Telegram doesn't keep retrying.
  return NextResponse.json({ ok: true });
}

/* ------------------------------------------------------------------ */
/* Message handling                                                    */
/* ------------------------------------------------------------------ */

async function handleMessage(msg: TgMessage): Promise<void> {
  const chatId = String(msg.chat.id);
  const text = (msg.text || "").trim();
  const from = msg.from;

  // A shared phone number (from the "Share my phone number" button).
  if (msg.contact) {
    await handleContact(chatId, msg);
    return;
  }

  // Commands always take priority and reset transient state.
  if (text.startsWith("/")) {
    const [cmdRaw, ...args] = text.split(/\s+/);
    const cmd = cmdRaw.split("@")[0].toLowerCase();
    // Maintenance gate: block feature commands for non-admins while on.
    if (await botBlockedForNonAdmin(chatId, from, cmd)) return;
    await handleCommand(chatId, cmd, args, from);
    return;
  }

  // Non-command text: route by conversation state.
  const state = await getState(chatId);
  if (state?.mode === "admin_chat" && typeof state.data.target === "string") {
    await adminChatSend(chatId, state.data.target, text);
    return;
  }
  if (state?.mode === "broadcast_compose") {
    await broadcastPreview(chatId, text);
    return;
  }
  if (state?.mode === "support") {
    await ingestSupportMessage(chatId, text, from?.first_name ?? null);
    return;
  }
  if (state?.mode === "link_code") {
    await handleCodeEntry(chatId, text, from);
    return;
  }
  if (state?.mode === "admin_lookup") {
    await adminLookup(chatId, text);
    return;
  }
  if (state?.mode === "login_email") {
    await handleLoginEmail(chatId, text);
    return;
  }
  if (state?.mode === "login_password") {
    await handleLoginPassword(chatId, msg, text);
    return;
  }

  // Maintenance gate for a plain "hello" from a non-admin.
  if (await botBlockedForNonAdmin(chatId, from)) return;

  // Default: show whatever's appropriate for this chat.
  await showStart(chatId, from);
}

async function handleCommand(
  chatId: string,
  cmd: string,
  args: string[],
  from?: { username?: string; first_name?: string }
): Promise<void> {
  switch (cmd) {
    case "/start":
    case "/menu": {
      await clearState(chatId);
      // Deep-link support: /start link_CODE
      const payload = args[0] || "";
      if (payload.toLowerCase().startsWith("link_")) {
        await doLink(chatId, payload.slice(5), from);
        return;
      }
      await showStart(chatId, from);
      return;
    }
    case "/cancel": {
      const had = await getState(chatId);
      await clearState(chatId);
      if (had) await sendMessage(chatId, `Okay, cancelled.`);
      await showStart(chatId, from);
      return;
    }
    case "/logout": {
      await logoutChat(chatId);
      await deleteChatCommands(chatId);
      await sendMessage(
        chatId,
        `✅ You've been logged out. Send /start to begin again, or link a different account.`
      );
      return;
    }
    case "/broadcast": {
      await handleBroadcastCommand(chatId, from);
      return;
    }
    case "/help": {
      await sendMessage(chatId, HELP_TEXT, { keyboard: [[{ text: "⬅️ Menu", callback_data: "menu" }]] });
      return;
    }
    case "/link": {
      await doLink(chatId, args[0] || "", from);
      return;
    }
    case "/unlink": {
      await unlinkByChatId(chatId);
      await sendMessage(chatId, `✅ Your Telegram has been disconnected from your eSIM4U account.`);
      return;
    }
    case "/support": {
      const userId = await getLinkedUserId(chatId);
      if (!userId) {
        const { text, keyboard } = linkHelpText();
        await sendMessage(chatId, `Link your account first to chat with support.\n\n${text}`, { keyboard });
        return;
      }
      await setState(chatId, "support", { acked: false });
      await sendMessage(
        chatId,
        `💬 <b>Support</b>\n\nYou're connected — just type your message and our team will reply here. Send /cancel to leave.`
      );
      return;
    }
    case "/admin": {
      await handleAdminCommand(chatId, from);
      return;
    }
    default: {
      await sendMessage(chatId, `Unknown command. Send /help to see what I can do.`);
    }
  }
}

/** Shared post-link steps: customer commands, welcome + menu, and phone prompt. */
async function finishLink(chatId: string, userId: string): Promise<void> {
  await clearState(chatId);
  await setChatCommands(chatId, CUSTOMER_COMMANDS);
  const { text, keyboard } = await mainMenuText(chatId);
  await sendMessage(chatId, `✅ <b>Account linked!</b> You'll now get your eSIM QR codes and support replies here.`, {
    keyboard,
  });
  await sendMessage(chatId, text, { keyboard });
  await maybeRequestPhone(chatId, userId);
}

async function doLink(chatId: string, code: string, from?: { username?: string; first_name?: string }): Promise<void> {
  if (!code) {
    const { text, keyboard } = linkHelpText();
    await sendMessage(chatId, text, { keyboard });
    return;
  }
  const userId = await consumeLinkCode(code, {
    chatId,
    username: from?.username ?? null,
    firstName: from?.first_name ?? null,
  });
  if (!userId) {
    await sendMessage(
      chatId,
      `❌ That code is invalid or has expired. Generate a fresh one in the app: <b>Profile → Connect Telegram</b>.`,
      { keyboard: [[{ text: "🌐 Open App", web_app: { url: `${appUrl()}/dashboard/profile` } }]] }
    );
    return;
  }
  await finishLink(chatId, userId);
}

/**
 * Handles a plain-text code sent while in the one-time-code linking flow. If the
 * code is wrong we stay in the flow and ask again (never bounce to the menu).
 */
async function handleCodeEntry(chatId: string, text: string, from: TgFrom): Promise<void> {
  const code = text.trim().replace(/^\/link\s+/i, "");
  if (!code) {
    await sendMessage(chatId, `Please send your 6-character code, or /cancel to go back.`);
    return;
  }
  const userId = await consumeLinkCode(code, {
    chatId,
    username: from?.username ?? null,
    firstName: from?.first_name ?? null,
  });
  if (!userId) {
    // Stay in the code flow and prompt again.
    await sendMessage(
      chatId,
      `❌ That code didn't work or has expired. Please send your <b>6-character code</b> again, or /cancel to go back.`
    );
    return;
  }
  await finishLink(chatId, userId);
}

async function ingestSupportMessage(chatId: string, text: string, fallbackName: string | null): Promise<void> {
  const userId = await getLinkedUserId(chatId);
  if (!userId) {
    await clearState(chatId);
    await sendMessage(chatId, `Please link your account first with /link.`);
    return;
  }
  if (!text.trim()) return;
  try {
    const info = await getUserInfo(userId);
    // Always carry a human-readable name so the admin inbox never shows a bare
    // "Customer": prefer the account name, then the Telegram first name.
    const displayName = info?.name || fallbackName || "Telegram customer";
    await sendChatMessage({
      userId,
      sender: "user",
      senderName: displayName,
      body: text,
      userEmail: info?.email,
      customerName: displayName,
    });
    // Notify admins in Telegram (live if watching, otherwise a ping with count).
    void notifyAdminsOfCustomerMessage(userId, displayName, text);
    // Confirm once per session, then stay quiet so the chat feels natural.
    const st = await getState(chatId);
    if (st?.mode === "support" && !st.data.acked) {
      await setState(chatId, "support", { acked: true });
      await sendMessage(chatId, `✅ Delivered. Our team will reply right here.`);
    }
  } catch (e) {
    if (e instanceof Error && e.message === "EMPTY_MESSAGE") return;
    await sendMessage(chatId, `Couldn't send your message right now. Please try again.`);
  }
}

/* ------------------------------------------------------------------ */
/* Admin command + reply                                               */
/* ------------------------------------------------------------------ */

async function handleAdminCommand(chatId: string, from: TgFrom): Promise<void> {
  // Already in an admin session → straight to the menu.
  const session = await getAdminSession(chatId);
  if (session) {
    const { text, keyboard } = adminMenu();
    await sendMessage(chatId, text, { keyboard });
    return;
  }
  // Otherwise the Telegram username must be on the allowlist. No password.
  if (await isAdminUsername(from?.username)) {
    await enterAdminMode(chatId, from?.username ?? null, from?.first_name ?? null);
    await clearState(chatId);
    await setChatCommands(chatId, ADMIN_COMMANDS);
    await sendMessage(chatId, `✅ <b>Admin access granted.</b>`);
    const { text, keyboard } = adminMenu();
    await sendMessage(chatId, text, { keyboard });
    return;
  }
  await sendMessage(
    chatId,
    `🔒 You're not an authorised admin. Ask a super admin to add your Telegram <b>@username</b> in the admin panel (Manage Admins → Telegram admins).`
  );
}

/** `/broadcast` shortcut — opens the broadcast menu for signed-in admins. */
async function handleBroadcastCommand(chatId: string, from: TgFrom): Promise<void> {
  const session = await getAdminSession(chatId);
  if (!session) {
    if (await isAdminUsername(from?.username)) {
      await sendMessage(chatId, `Send /admin to sign in first, then tap 📢 Broadcast.`);
    } else {
      await sendMessage(chatId, `🔒 That's an admin-only command.`);
    }
    return;
  }
  await clearState(chatId);
  const { text, keyboard } = broadcastMenu();
  await sendMessage(chatId, text, { keyboard });
}

async function adminLookup(chatId: string, email: string): Promise<void> {
  const admin = await getAdminSession(chatId);
  if (!admin) {
    await clearState(chatId);
    await sendMessage(chatId, `Your admin session is no longer active. Send /admin to sign in again.`);
    return;
  }
  const user = await findUserByEmail(email);
  await clearState(chatId);
  if (!user) {
    await sendMessage(chatId, `No customer found with that email. Try again from the menu.`, {
      keyboard: [[{ text: "🔎 Search again", callback_data: "adm:lookup" }], [{ text: "⬅️ Back", callback_data: "adm:menu" }]],
    });
    return;
  }
  const { text, keyboard } = await customerDetailView(user.id);
  await sendMessage(chatId, text, { keyboard });
}

/* ------------------------------------------------------------------ */
/* Email + password login (option 2)                                   */
/* ------------------------------------------------------------------ */

function validEmail(e: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e.trim());
}

/** Verifies a customer's website credentials via Better Auth. */
async function verifyCustomerLogin(email: string, password: string): Promise<UserInfo | null> {
  try {
    const res = await auth.api.signInEmail({ body: { email: email.trim(), password }, headers: new Headers() });
    const user = (res as { user?: { id?: string } } | null)?.user;
    if (user?.id) return await getUserInfo(user.id);
    return null;
  } catch {
    return null;
  }
}

async function handleLoginEmail(chatId: string, email: string): Promise<void> {
  const clean = email.trim();
  if (!validEmail(clean)) {
    await sendMessage(chatId, `That doesn't look like a valid email. Please send your email address again, or /cancel.`);
    return;
  }
  await setState(chatId, "login_password", { email: clean });
  await sendMessage(
    chatId,
    `🔒 Now send your <b>password</b>.\n\n<i>For your security, I'll delete the password message as soon as you're signed in.</i>`
  );
}

async function handleLoginPassword(chatId: string, msg: TgMessage, password: string): Promise<void> {
  const state = await getState(chatId);
  const email = typeof state?.data.email === "string" ? state.data.email : "";
  // Wipe the password message from the chat straight away.
  await deleteMessage(chatId, msg.message_id);

  if (!email) {
    await clearState(chatId);
    await sendMessage(chatId, `Something went wrong. Please start again with /link.`);
    return;
  }
  if (!password.trim()) {
    await sendMessage(chatId, `Please send your password, or /cancel.`);
    return;
  }

  const user = await verifyCustomerLogin(email, password);
  if (!user) {
    // Stay in the login flow — ask for the email again rather than dropping out.
    await setState(chatId, "login_email");
    await sendMessage(
      chatId,
      `❌ Invalid email or password. If your email isn't verified yet, use the one-time code option instead.\n\n` +
        `Send your <b>email address</b> to try again, or /cancel.`
    );
    return;
  }
  await linkUserChat(user.id, { chatId, username: msg.from?.username ?? null, firstName: msg.from?.first_name ?? null });
  await finishLink(chatId, user.id);
}

/* ------------------------------------------------------------------ */
/* Callback (inline button) handling                                   */
/* ------------------------------------------------------------------ */

async function handleCallback(cb: TgCallbackQuery): Promise<void> {
  const chatId = String(cb.message?.chat.id ?? cb.from.id);
  const messageId = cb.message?.message_id;
  const data = cb.data || "";
  await answerCallbackQuery(cb.id);

  const replace = async (v: { text: string; keyboard: InlineKeyboard }) => {
    if (messageId) {
      const res = await editMessageText(chatId, messageId, v.text, { keyboard: v.keyboard });
      if (!res.ok) await sendMessage(chatId, v.text, { keyboard: v.keyboard });
    } else {
      await sendMessage(chatId, v.text, { keyboard: v.keyboard });
    }
  };

  // Maintenance: block customer callbacks for non-admins (admin/role flows pass).
  if (!data.startsWith("adm:") && !data.startsWith("role:")) {
    if (await botBlockedForNonAdmin(chatId, cb.from)) return;
  }

  // Customer-facing callbacks require a linked account (except menu/help/link).
  const userId = await getLinkedUserId(chatId);

  // ---- Role chooser (recognised admin usernames) ----
  if (data === "role:admin") {
    if (await isAdminUsername(cb.from.username)) {
      await enterAdminMode(chatId, cb.from.username ?? null, cb.from.first_name ?? null);
      await clearState(chatId);
      await setChatCommands(chatId, ADMIN_COMMANDS);
      return replace(adminMenu());
    }
    return replace(await mainMenuText(chatId));
  }
  if (data === "role:customer") {
    await exitAdminMode(chatId);
    await clearState(chatId);
    await setChatCommands(chatId, CUSTOMER_COMMANDS);
    return replace(await mainMenuText(chatId));
  }

  // ---- Admin callbacks ----
  if (data.startsWith("adm:")) {
    const rest = data.slice(4);
    const admin = await getAdminSession(chatId);
    if (!admin) {
      await sendMessage(chatId, `🔐 Send /admin to sign in first.`);
      return;
    }
    // Navigations that leave any live chat / compose flow.
    if (rest === "menu") {
      await clearState(chatId);
      return replace(adminMenu());
    }
    if (rest === "convos") {
      await clearState(chatId);
      return replace(await adminConvosView());
    }
    if (rest === "wallet") {
      await clearState(chatId);
      return replace(await resellerWalletView());
    }
    if (rest === "lookup") {
      await setState(chatId, "admin_lookup");
      await sendMessage(chatId, `🔎 Send the customer's <b>email address</b> to look them up.`);
      return;
    }
    if (rest === "broadcast") {
      await clearState(chatId);
      return replace(broadcastMenu());
    }
    if (rest === "bccustom") {
      await setState(chatId, "broadcast_compose");
      await sendMessage(chatId, `✍️ Type the message you want to broadcast to all users, or /cancel.`);
      return;
    }
    if (rest.startsWith("bc:")) {
      const idx = Number(rest.slice(3));
      const tpl = BROADCAST_TEMPLATES[idx];
      if (!tpl) return replace(broadcastMenu());
      return replace(await broadcastConfirm(chatId, tpl.body));
    }
    if (rest === "bcgo") {
      const st = await getState(chatId);
      const body = typeof st?.data.body === "string" ? st.data.body : "";
      if (st?.mode !== "broadcast_confirm" || !body) {
        await clearState(chatId);
        return replace(broadcastMenu());
      }
      await broadcastSend(chatId, body);
      return;
    }
    // Opening a conversation enters a persistent, two-way live chat session.
    if (rest.startsWith("conv:")) {
      const target = rest.slice(5);
      await setState(chatId, "admin_chat", { target });
      return replace(await adminChatView(target));
    }
    if (rest.startsWith("reply:")) {
      const target = rest.slice(6);
      await setState(chatId, "admin_chat", { target });
      return replace(await adminChatView(target));
    }
    if (rest.startsWith("cust:")) return replace(await customerDetailView(rest.slice(5)));
    if (rest.startsWith("block:") || rest.startsWith("unblock:")) {
      const block = rest.startsWith("block:");
      const target = rest.slice(block ? 6 : 8);
      await blockCustomer(target, block, admin.name || "admin");
      return replace(await customerDetailView(target));
    }
    return;
  }

  // ---- Customer callbacks ----
  switch (data) {
    case "menu": {
      await clearState(chatId);
      return replace(await mainMenuText(chatId));
    }
    case "help":
      return replace({ text: HELP_TEXT, keyboard: [[{ text: "⬅️ Menu", callback_data: "menu" }]] });
    case "link_help":
      await clearState(chatId);
      return replace(linkHelpText());
    case "link_code":
      // Enter the code-entry flow so a plain code (with or without /link) works
      // and a wrong code just re-prompts instead of dropping to the menu.
      await setState(chatId, "link_code");
      return replace(linkCodeText());
    case "link_login": {
      await setState(chatId, "login_email");
      await sendMessage(chatId, `Send me the <b>email address</b> for your eSIM4U account.`);
      return;
    }
    case "support": {
      if (!userId) return replace(linkHelpText());
      await setState(chatId, "support", { acked: false });
      await sendMessage(
        chatId,
        `💬 <b>Support</b>\n\nYou're connected — just type your message and our team will reply here. Send /cancel to leave.`
      );
      return;
    }
    case "esims":
      if (!userId) return replace(linkHelpText());
      await clearState(chatId);
      return replace(await esimsView(userId));
    case "wallet":
      if (!userId) return replace(linkHelpText());
      await clearState(chatId);
      return replace(await walletView(userId));
    case "usage": {
      if (!userId) return replace(linkHelpText());
      await clearState(chatId);
      // No specific eSIM chosen: show the eSIM list so they can pick one.
      return replace(await esimsView(userId));
    }
  }

  if (data.startsWith("esim:")) {
    if (!userId) return replace(linkHelpText());
    const orderId = Number(data.slice(5));
    const e = await getEsim(userId, orderId);
    if (!e) return replace(await esimsView(userId));
    return replace({
      text: esimDetailText(e),
      keyboard: [
        [{ text: "📊 Data usage", callback_data: `usage:${orderId}` }],
        [{ text: "📱 View QR in app", web_app: { url: `${appUrl()}/dashboard/esims` } }],
        [{ text: "⬅️ My eSIMs", callback_data: "esims" }],
      ],
    });
  }
  if (data.startsWith("usage:")) {
    if (!userId) return replace(linkHelpText());
    const orderId = Number(data.slice(6));
    await sendChatAction(chatId);
    return replace(await usageView(userId, orderId));
  }
}
