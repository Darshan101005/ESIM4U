import pool from "@/lib/db";
import { ensureSupportSchema } from "@/lib/support-schema";
import { deleteCloudinaryAssets } from "@/lib/cloudinary";

export type Sender = "user" | "admin";

export interface Attachment {
  url: string;
  name: string;
  type: string; // "image" | "video" | "raw"
  size: number;
  /** Cloudinary public id — kept so files can be deleted during retention cleanup. */
  publicId?: string;
}

export interface ChatMessage {
  id: number;
  user_id: string;
  sender: Sender;
  sender_name: string | null;
  body: string | null;
  attachments: Attachment[];
  reply_to_id: number | null;
  deleted_for_everyone: boolean;
  read_at: string | null;
  created_at: string;
}

/** Chat messages older than this are pruned (sliding window). */
export const CHAT_RETENTION_DAYS = 7;

/** How recently an admin must have pinged to be considered "online". */
const PRESENCE_WINDOW_SECONDS = 70;

export function generateTicketRef(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `TKT-${timestamp}-${random}`;
}

/** Short, readable preview for conversation lists / notifications. */
function previewOf(body: string | null, attachments: Attachment[]): string {
  const text = (body || "").replace(/[*_~`]/g, "").trim();
  if (text) return text.length > 90 ? `${text.slice(0, 90)}…` : text;
  if (attachments.length > 0) return attachments.length === 1 ? "📎 Attachment" : `📎 ${attachments.length} attachments`;
  return "";
}

function parseAttachments(raw: unknown): Attachment[] {
  if (Array.isArray(raw)) return raw as Attachment[];
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }
  return [];
}

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

interface NotifyInput {
  audience: Sender;
  userId: string;
  kind: "chat" | "ticket";
  ref: string;
  title: string;
  body: string;
}

async function createNotification(n: NotifyInput): Promise<void> {
  await pool.query(
    `INSERT INTO support_notifications (audience, user_id, kind, ref, title, body)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [n.audience, n.userId, n.kind, n.ref, n.title, n.body]
  );
}

export interface NotificationRow {
  id: number;
  kind: string;
  ref: string | null;
  title: string | null;
  body: string | null;
  read: boolean;
  created_at: string;
}

export async function getNotifications(audience: Sender, userId?: string): Promise<{ items: NotificationRow[]; unread: number }> {
  await ensureSupportSchema();
  const where = audience === "user" ? `audience = 'user' AND user_id = $1` : `audience = 'admin'`;
  const params = audience === "user" ? [userId] : [];
  const items = await pool.query(
    `SELECT id, kind, ref, title, body, read, created_at
     FROM support_notifications WHERE ${where} ORDER BY created_at DESC LIMIT 30`,
    params
  );
  const unread = await pool.query(
    `SELECT COUNT(*)::int AS c FROM support_notifications WHERE ${where} AND read = false`,
    params
  );
  return { items: items.rows as NotificationRow[], unread: unread.rows[0].c as number };
}

export async function markNotificationsRead(audience: Sender, userId?: string, kind?: "chat" | "ticket"): Promise<void> {
  await ensureSupportSchema();
  const clauses = [audience === "user" ? `audience = 'user' AND user_id = $1` : `audience = 'admin'`];
  const params: (string | undefined)[] = audience === "user" ? [userId] : [];
  if (kind) {
    params.push(kind);
    clauses.push(`kind = $${params.length}`);
  }
  await pool.query(`UPDATE support_notifications SET read = true WHERE ${clauses.join(" AND ")} AND read = false`, params);
}

/* ------------------------------------------------------------------ */
/* Live chat                                                           */
/* ------------------------------------------------------------------ */

export async function getConversation(userId: string) {
  await ensureSupportSchema();
  const r = await pool.query(`SELECT * FROM support_conversations WHERE user_id = $1`, [userId]);
  return r.rows[0] || null;
}

async function ensureConversation(userId: string, userEmail?: string | null, customerName?: string | null) {
  await pool.query(
    `INSERT INTO support_conversations (user_id, user_email, customer_name)
     VALUES ($1,$2,$3)
     ON CONFLICT (user_id) DO UPDATE SET
       user_email = COALESCE(EXCLUDED.user_email, support_conversations.user_email),
       customer_name = COALESCE(EXCLUDED.customer_name, support_conversations.customer_name)`,
    [userId, userEmail ?? null, customerName ?? null]
  );
}

export async function listChatMessages(userId: string, side: Sender = "user"): Promise<ChatMessage[]> {
  await ensureSupportSchema();
  // Hide messages the viewer deleted "for me". Messages deleted "for everyone"
  // are still returned (as tombstones) with their content already cleared.
  const hideCol = side === "admin" ? "deleted_for_admin" : "deleted_for_user";
  const r = await pool.query(
    `SELECT id, user_id, sender, sender_name, body, attachments, reply_to_id, deleted_for_everyone, read_at, created_at
     FROM support_messages WHERE user_id = $1 AND ${hideCol} = false ORDER BY created_at ASC, id ASC`,
    [userId]
  );
  return r.rows.map((row) => ({ ...row, attachments: parseAttachments(row.attachments) })) as ChatMessage[];
}

interface SendChatInput {
  userId: string;
  sender: Sender;
  senderName?: string | null;
  body?: string | null;
  attachments?: Attachment[];
  replyToId?: number | null;
  userEmail?: string | null;
  customerName?: string | null;
}

export async function sendChatMessage(input: SendChatInput): Promise<ChatMessage> {
  await ensureSupportSchema();
  const attachments = input.attachments ?? [];
  const body = (input.body ?? "").trim();
  if (!body && attachments.length === 0) throw new Error("EMPTY_MESSAGE");

  await ensureConversation(input.userId, input.userEmail, input.customerName);

  // Validate the replied-to message belongs to this conversation.
  let replyToId: number | null = null;
  if (input.replyToId) {
    const q = await pool.query(`SELECT id FROM support_messages WHERE id = $1 AND user_id = $2`, [input.replyToId, input.userId]);
    if (q.rows.length > 0) replyToId = input.replyToId;
  }

  const inserted = await pool.query(
    `INSERT INTO support_messages (user_id, sender, sender_name, body, attachments, reply_to_id)
     VALUES ($1,$2,$3,$4,$5::jsonb,$6) RETURNING *`,
    [input.userId, input.sender, input.senderName ?? null, body || null, JSON.stringify(attachments), replyToId]
  );

  const preview = previewOf(body, attachments);
  // A customer message on a resolved chat reopens it.
  const reopen = input.sender === "user";
  await pool.query(
    `UPDATE support_conversations
       SET last_message_at = now(), last_message_preview = $2, last_sender = $3,
           status = CASE WHEN $4 AND status = 'resolved' THEN 'open' ELSE status END,
           reopened_at = CASE WHEN $4 AND status = 'resolved' THEN now() ELSE reopened_at END
     WHERE user_id = $1`,
    [input.userId, preview, input.sender, reopen]
  );

  if (input.sender === "user") {
    await createNotification({
      audience: "admin",
      userId: input.userId,
      kind: "chat",
      ref: input.userId,
      title: input.customerName || input.senderName || "Customer",
      body: preview,
    });
  } else {
    await createNotification({
      audience: "user",
      userId: input.userId,
      kind: "chat",
      ref: input.userId,
      title: "Support replied",
      body: preview,
    });
  }

  const row = inserted.rows[0];
  return { ...row, attachments: parseAttachments(row.attachments) } as ChatMessage;
}

/** Marks the OTHER party's messages as read (drives the double tick) + clears bell. */
export async function markChatRead(userId: string, reader: Sender): Promise<void> {
  await ensureSupportSchema();
  const otherSender: Sender = reader === "admin" ? "user" : "admin";
  await pool.query(
    `UPDATE support_messages SET read_at = now()
     WHERE user_id = $1 AND sender = $2 AND read_at IS NULL`,
    [userId, otherSender]
  );
  if (reader === "admin") {
    // Clear admin chat notifications for this specific customer.
    await pool.query(
      `UPDATE support_notifications SET read = true
       WHERE audience = 'admin' AND kind = 'chat' AND ref = $1 AND read = false`,
      [userId]
    );
  } else {
    await pool.query(
      `UPDATE support_notifications SET read = true
       WHERE audience = 'user' AND user_id = $1 AND kind = 'chat' AND read = false`,
      [userId]
    );
  }
}

export async function resolveConversation(userId: string, byName: string): Promise<void> {
  await ensureSupportSchema();
  await pool.query(
    `UPDATE support_conversations SET status = 'resolved', resolved_at = now(), resolved_by = $2 WHERE user_id = $1`,
    [userId, byName]
  );
}

export async function reopenConversation(userId: string): Promise<void> {
  await ensureSupportSchema();
  await pool.query(
    `UPDATE support_conversations SET status = 'open', reopened_at = now(), resolved_at = NULL, resolved_by = NULL WHERE user_id = $1`,
    [userId]
  );
}

export interface ConversationSummary {
  user_id: string;
  user_email: string | null;
  customer_name: string | null;
  status: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  last_sender: string | null;
  unread: number;
}

/** Admin conversation list (WhatsApp-style sidebar). */
export async function listConversations(): Promise<ConversationSummary[]> {
  await ensureSupportSchema();
  const r = await pool.query(
    `SELECT c.user_id, c.user_email, c.customer_name, c.status, c.last_message_at,
            c.last_message_preview, c.last_sender,
            COALESCE(u.unread, 0)::int AS unread
     FROM support_conversations c
     LEFT JOIN (
       SELECT user_id, COUNT(*) AS unread FROM support_messages
       WHERE sender = 'user' AND read_at IS NULL GROUP BY user_id
     ) u ON u.user_id = c.user_id
     WHERE c.last_message_at IS NOT NULL
     ORDER BY c.last_message_at DESC`
  );
  return r.rows as ConversationSummary[];
}

/**
 * Deletes a single chat message. `scope="me"` hides it only from the deleter's
 * side; `scope="everyone"` leaves a tombstone visible to both (only allowed on
 * the deleter's own messages, WhatsApp-style) and removes any Cloudinary files.
 */
export async function deleteChatMessage(p: {
  userId: string;
  messageId: number;
  scope: "me" | "everyone";
  side: Sender;
}): Promise<void> {
  await ensureSupportSchema();
  const r = await pool.query(`SELECT * FROM support_messages WHERE id = $1 AND user_id = $2`, [p.messageId, p.userId]);
  const msg = r.rows[0];
  if (!msg) throw new Error("MESSAGE_NOT_FOUND");

  if (p.scope === "everyone") {
    if (msg.sender !== p.side) throw new Error("NOT_OWN_MESSAGE");
    const assets = parseAttachments(msg.attachments)
      .filter((a) => a.publicId)
      .map((a) => ({ publicId: a.publicId as string, resourceType: a.type }));
    if (assets.length > 0) await deleteCloudinaryAssets(assets);
    await pool.query(
      `UPDATE support_messages SET deleted_for_everyone = true, body = NULL, attachments = '[]'::jsonb WHERE id = $1`,
      [p.messageId]
    );
  } else {
    const col = p.side === "admin" ? "deleted_for_admin" : "deleted_for_user";
    await pool.query(`UPDATE support_messages SET ${col} = true WHERE id = $1`, [p.messageId]);
  }
}

/** Permanently deletes an entire conversation + its messages, files and chat notifications. */
export async function deleteConversation(userId: string): Promise<void> {
  await ensureSupportSchema();
  const r = await pool.query(`SELECT attachments FROM support_messages WHERE user_id = $1`, [userId]);
  const assets: { publicId: string; resourceType?: string }[] = [];
  for (const row of r.rows) {
    for (const a of parseAttachments(row.attachments)) {
      if (a.publicId) assets.push({ publicId: a.publicId, resourceType: a.type });
    }
  }
  if (assets.length > 0) await deleteCloudinaryAssets(assets);
  await pool.query(`DELETE FROM support_messages WHERE user_id = $1`, [userId]);
  await pool.query(`DELETE FROM support_conversations WHERE user_id = $1`, [userId]);
  await pool.query(`DELETE FROM support_notifications WHERE kind = 'chat' AND ref = $1`, [userId]);
}

/** Count of the OTHER party's unread messages for a single conversation. */
export async function chatUnreadCount(userId: string, reader: Sender): Promise<number> {
  await ensureSupportSchema();
  const otherSender: Sender = reader === "admin" ? "user" : "admin";
  const r = await pool.query(
    `SELECT COUNT(*)::int AS c FROM support_messages WHERE user_id = $1 AND sender = $2 AND read_at IS NULL`,
    [userId, otherSender]
  );
  return r.rows[0].c as number;
}

/* ------------------------------------------------------------------ */
/* Tickets                                                             */
/* ------------------------------------------------------------------ */

interface CreateTicketInput {
  userId: string;
  userEmail?: string | null;
  customerName?: string | null;
  title: string;
  subject?: string | null;
  category?: string | null;
  department?: string | null;
  body: string;
  attachments?: Attachment[];
}

export async function createTicket(input: CreateTicketInput) {
  await ensureSupportSchema();
  const ref = generateTicketRef();
  const ticket = await pool.query(
    `INSERT INTO support_tickets
       (ticket_ref, user_id, user_email, customer_name, title, subject, category, department,
        status, last_reply_by, last_reply_at, user_read_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'open','user',now(),now(),now()) RETURNING *`,
    [
      ref,
      input.userId,
      input.userEmail ?? null,
      input.customerName ?? null,
      input.title,
      input.subject ?? null,
      input.category ?? null,
      input.department ?? null,
    ]
  );
  const t = ticket.rows[0];
  await pool.query(
    `INSERT INTO support_ticket_messages (ticket_id, sender, sender_name, body, attachments)
     VALUES ($1,'user',$2,$3,$4::jsonb)`,
    [t.id, input.customerName ?? null, input.body, JSON.stringify(input.attachments ?? [])]
  );
  await createNotification({
    audience: "admin",
    userId: input.userId,
    kind: "ticket",
    ref,
    title: `New ticket · ${input.customerName || input.userEmail || "Customer"}`,
    body: input.title,
  });
  return t;
}

export async function listTicketsForUser(userId: string) {
  await ensureSupportSchema();
  const r = await pool.query(
    `SELECT id, ticket_ref, title, subject, category, department, status, last_reply_by, last_reply_at, created_at,
            (last_reply_by = 'admin' AND (user_read_at IS NULL OR user_read_at < last_reply_at)) AS unread
     FROM support_tickets WHERE user_id = $1 ORDER BY updated_at DESC`,
    [userId]
  );
  return r.rows;
}

export async function listAllTickets(status?: string) {
  await ensureSupportSchema();
  let q = `SELECT id, ticket_ref, user_id, user_email, customer_name, title, subject, category, department, status,
                  last_reply_by, last_reply_at, created_at,
                  (last_reply_by = 'user' AND (admin_read_at IS NULL OR admin_read_at < last_reply_at)) AS unread
           FROM support_tickets`;
  const params: string[] = [];
  if (status) {
    params.push(status);
    q += ` WHERE status = $1`;
  }
  q += ` ORDER BY updated_at DESC LIMIT 200`;
  const r = await pool.query(q, params);
  return r.rows;
}

export async function getTicket(idOrRef: string | number, forUserId?: string) {
  await ensureSupportSchema();
  const byId = typeof idOrRef === "number" || /^\d+$/.test(String(idOrRef));
  const r = await pool.query(
    `SELECT * FROM support_tickets WHERE ${byId ? "id" : "ticket_ref"} = $1`,
    [byId ? Number(idOrRef) : idOrRef]
  );
  const ticket = r.rows[0];
  if (!ticket) return null;
  if (forUserId && ticket.user_id !== forUserId) return null;
  const msgs = await pool.query(
    `SELECT id, sender, sender_name, body, attachments, created_at
     FROM support_ticket_messages WHERE ticket_id = $1 ORDER BY created_at ASC, id ASC`,
    [ticket.id]
  );
  return {
    ticket,
    messages: msgs.rows.map((m) => ({ ...m, attachments: parseAttachments(m.attachments) })),
  };
}

interface ReplyTicketInput {
  ticketId: number;
  sender: Sender;
  senderName?: string | null;
  body?: string | null;
  attachments?: Attachment[];
}

export async function replyTicket(input: ReplyTicketInput) {
  await ensureSupportSchema();
  const attachments = input.attachments ?? [];
  const body = (input.body ?? "").trim();
  if (!body && attachments.length === 0) throw new Error("EMPTY_MESSAGE");

  const tRes = await pool.query(`SELECT * FROM support_tickets WHERE id = $1`, [input.ticketId]);
  const ticket = tRes.rows[0];
  if (!ticket) throw new Error("TICKET_NOT_FOUND");

  await pool.query(
    `INSERT INTO support_ticket_messages (ticket_id, sender, sender_name, body, attachments)
     VALUES ($1,$2,$3,$4,$5::jsonb)`,
    [input.ticketId, input.sender, input.senderName ?? null, body || null, JSON.stringify(attachments)]
  );

  // Admin reply => answered; customer reply on an answered/resolved ticket => open.
  const newStatus =
    input.sender === "admin" ? "answered" : ticket.status === "closed" ? "closed" : "open";
  await pool.query(
    `UPDATE support_tickets
       SET last_reply_by = $2, last_reply_at = now(), status = $3, updated_at = now(),
           ${input.sender === "admin" ? "admin_read_at = now()" : "user_read_at = now()"}
     WHERE id = $1`,
    [input.ticketId, input.sender, newStatus]
  );

  if (input.sender === "admin") {
    await createNotification({
      audience: "user",
      userId: ticket.user_id,
      kind: "ticket",
      ref: ticket.ticket_ref,
      title: "Support replied to your ticket",
      body: ticket.title,
    });
  } else {
    await createNotification({
      audience: "admin",
      userId: ticket.user_id,
      kind: "ticket",
      ref: ticket.ticket_ref,
      title: `Ticket reply · ${ticket.customer_name || ticket.user_email || "Customer"}`,
      body: ticket.title,
    });
  }
  return ticket;
}

export async function setTicketStatus(ticketId: number, status: string): Promise<void> {
  await ensureSupportSchema();
  await pool.query(`UPDATE support_tickets SET status = $2, updated_at = now() WHERE id = $1`, [ticketId, status]);
}

export async function markTicketRead(ticketId: number, reader: Sender): Promise<void> {
  await ensureSupportSchema();
  const col = reader === "admin" ? "admin_read_at" : "user_read_at";
  await pool.query(`UPDATE support_tickets SET ${col} = now() WHERE id = $1`, [ticketId]);
}

/* ------------------------------------------------------------------ */
/* Admin presence                                                      */
/* ------------------------------------------------------------------ */

export async function adminHeartbeat(adminId: number, adminName: string): Promise<void> {
  await ensureSupportSchema();
  await pool.query(
    `INSERT INTO admin_presence (admin_id, admin_name, last_seen)
     VALUES ($1,$2,now())
     ON CONFLICT (admin_id) DO UPDATE SET admin_name = EXCLUDED.admin_name, last_seen = now()`,
    [adminId, adminName]
  );
}

export async function isSupportOnline(): Promise<boolean> {
  await ensureSupportSchema();
  const r = await pool.query(
    `SELECT 1 FROM admin_presence WHERE last_seen > now() - ($1 || ' seconds')::interval LIMIT 1`,
    [String(PRESENCE_WINDOW_SECONDS)]
  );
  return r.rows.length > 0;
}

/* ------------------------------------------------------------------ */
/* Retention — 7-day sliding window for chats                          */
/* ------------------------------------------------------------------ */

let lastPrune = 0;
const PRUNE_INTERVAL_MS = 10 * 60 * 1000; // run at most every 10 minutes

/** Throttled entry point — safe to call on every chat poll. */
export async function pruneOldChatsIfDue(): Promise<void> {
  if (Date.now() - lastPrune < PRUNE_INTERVAL_MS) return;
  lastPrune = Date.now();
  try {
    await pruneOldChats();
  } catch {
    // Never let cleanup break a request.
  }
}

/**
 * Deletes chat messages older than the retention window (sliding), removes
 * their Cloudinary files, drops conversations that end up empty, and prunes
 * stale chat notifications. Tickets are intentionally kept for reference.
 */
export async function pruneOldChats(): Promise<void> {
  await ensureSupportSchema();
  const days = String(CHAT_RETENTION_DAYS);

  // Collect Cloudinary assets attached to messages about to be deleted.
  const old = await pool.query(
    `SELECT attachments FROM support_messages WHERE created_at < now() - ($1 || ' days')::interval`,
    [days]
  );
  const assets: { publicId: string; resourceType?: string }[] = [];
  for (const row of old.rows) {
    for (const a of parseAttachments(row.attachments)) {
      if (a.publicId) assets.push({ publicId: a.publicId, resourceType: a.type });
    }
  }
  if (assets.length > 0) await deleteCloudinaryAssets(assets);

  await pool.query(`DELETE FROM support_messages WHERE created_at < now() - ($1 || ' days')::interval`, [days]);
  // Drop conversations that no longer have any messages.
  await pool.query(
    `DELETE FROM support_conversations c WHERE NOT EXISTS (SELECT 1 FROM support_messages m WHERE m.user_id = c.user_id)`
  );
  // Prune stale chat notifications (tickets keep theirs).
  await pool.query(
    `DELETE FROM support_notifications WHERE kind = 'chat' AND created_at < now() - ($1 || ' days')::interval`,
    [days]
  );
}
