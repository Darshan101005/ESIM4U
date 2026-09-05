"use client";

import { useRef, useState } from "react";
import { Check, CheckCheck, Paperclip, FileText, X, Send, Loader2, ImageIcon, Reply, CornerUpLeft, MoreVertical, Trash2, Ban } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface Attachment {
  url: string;
  name: string;
  type: string; // image | video | raw
  size: number;
  publicId?: string;
}

export interface PendingAttachment {
  dataUri: string;
  name: string;
  type: string; // mime
  size: number;
}

export const MAX_ATTACHMENTS = 5;
export const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15MB

/* ------------------------------------------------------------------ */
/* Message formatting (**bold**, *italic*, _italic_) — XSS-safe        */
/* ------------------------------------------------------------------ */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Escapes HTML first, then applies a tiny, safe markdown subset. */
export function formatMessageHtml(body: string): string {
  let html = escapeHtml(body);
  html = html.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="underline break-all">$1</a>'
  );
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/(^|[\s(])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  html = html.replace(/(^|[\s(])_([^_\n]+)_/g, "$1<em>$2</em>");
  html = html.replace(/\n/g, "<br/>");
  return html;
}

export function FormattedText({ body, className }: { body: string; className?: string }) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: formatMessageHtml(body) }} />;
}

/** Plain-text snippet (markers stripped) for quotes/previews. */
export function snippetOf(body: string | null, attachments: Attachment[], max = 70): string {
  const text = (body || "").replace(/[*_~`]/g, "").replace(/\n/g, " ").trim();
  if (text) return text.length > max ? `${text.slice(0, max)}…` : text;
  if (attachments && attachments.length > 0) return attachments.length === 1 ? "📎 Attachment" : `📎 ${attachments.length} attachments`;
  return "";
}

/* ------------------------------------------------------------------ */
/* Delivery ticks                                                      */
/* ------------------------------------------------------------------ */

export function DeliveryTick({ read }: { read: boolean }) {
  return read ? (
    <CheckCheck className="w-3.5 h-3.5 text-sky-400" strokeWidth={2.5} />
  ) : (
    <Check className="w-3.5 h-3.5 text-white/70" strokeWidth={2.5} />
  );
}

/* ------------------------------------------------------------------ */
/* Time helpers                                                        */
/* ------------------------------------------------------------------ */

export function formatBytes(bytes: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

/** In-thread day separator: Today / Yesterday / full date (WhatsApp style). */
export function dayLabel(iso: string): string {
  try {
    const d = new Date(iso);
    const today = new Date();
    const yest = new Date();
    yest.setDate(today.getDate() - 1);
    if (sameDay(d, today)) return "Today";
    if (sameDay(d, yest)) return "Yesterday";
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

/** Conversation-list timestamp: time today / Yesterday / weekday within a week / date. */
export function whatsappListTime(iso: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const now = new Date();
    const yest = new Date();
    yest.setDate(now.getDate() - 1);
    if (sameDay(d, now)) return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    if (sameDay(d, yest)) return "Yesterday";
    const diffDays = (now.getTime() - d.getTime()) / 86400000;
    if (diffDays < 7) return d.toLocaleDateString(undefined, { weekday: "long" });
    return d.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return "";
  }
}

/* ------------------------------------------------------------------ */
/* Attachment rendering (inside bubbles)                               */
/* ------------------------------------------------------------------ */

export function AttachmentView({ attachments, mine }: { attachments: Attachment[]; mine: boolean }) {
  if (!attachments || attachments.length === 0) return null;
  return (
    <div className="flex flex-col gap-2 mt-1">
      {attachments.map((a, i) =>
        a.type === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" className="block">
            <img src={a.url} alt={a.name} className="rounded-lg max-w-[220px] max-h-[220px] object-cover border border-black/5" />
          </a>
        ) : a.type === "video" ? (
          <video key={i} src={a.url} controls className="rounded-lg max-w-[240px] border border-black/5" />
        ) : (
          <a
            key={i}
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 rounded-lg px-3 py-2 border transition-colors ${
              mine ? "bg-white/15 border-white/20 hover:bg-white/25" : "bg-gray-50 border-gray-100 hover:bg-gray-100"
            }`}
          >
            <FileText className={`w-4 h-4 shrink-0 ${mine ? "text-white" : "text-[#FF561E]"}`} />
            <span className={`text-[12px] font-medium truncate max-w-[160px] ${mine ? "text-white" : "text-[#1A1D20]"}`}>{a.name}</span>
            {a.size > 0 && <span className={`text-[10px] ${mine ? "text-white/70" : "text-gray-400"}`}>{formatBytes(a.size)}</span>}
          </a>
        )
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Composer (text + Ctrl+B/Ctrl+I + attachments + reply banner)        */
/* ------------------------------------------------------------------ */

export interface ReplyTarget {
  id: number;
  who: string; // display label of who is being quoted
  preview: string;
}

interface ComposerProps {
  onSend: (body: string, attachments: PendingAttachment[]) => Promise<void> | void;
  disabled?: boolean;
  placeholder?: string;
  replyingTo?: ReplyTarget | null;
  onCancelReply?: () => void;
}

export function Composer({ onSend, disabled, placeholder, replyingTo, onCancelReply }: ComposerProps) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<PendingAttachment[]>([]);
  const [sending, setSending] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const wrapSelection = (marker: string) => {
    const ta = taRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = text.slice(start, end) || "text";
    const next = text.slice(0, start) + marker + selected + marker + text.slice(end);
    setText(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + marker.length, start + marker.length + selected.length);
    });
  };

  const pickFiles = (list: FileList | null) => {
    if (!list) return;
    const room = MAX_ATTACHMENTS - files.length;
    if (room <= 0) return;
    Array.from(list)
      .slice(0, room)
      .forEach((file) => {
        if (file.size > MAX_FILE_BYTES) return;
        const reader = new FileReader();
        reader.onload = () =>
          setFiles((prev) =>
            prev.length < MAX_ATTACHMENTS
              ? [...prev, { dataUri: reader.result as string, name: file.name, type: file.type, size: file.size }]
              : prev
          );
        reader.readAsDataURL(file);
      });
  };

  const submit = async () => {
    if (sending || disabled) return;
    if (!text.trim() && files.length === 0) return;
    setSending(true);
    try {
      await onSend(text.trim(), files);
      setText("");
      setFiles([]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border-t border-gray-100 bg-white p-3">
      {replyingTo && (
        <div className="flex items-center gap-2 mb-2 rounded-lg bg-gray-50 border-l-2 border-[#FF561E] pl-3 pr-1 py-1.5">
          <CornerUpLeft className="w-3.5 h-3.5 text-[#FF561E] shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-[#FF561E] leading-tight">Replying to {replyingTo.who}</p>
            <p className="text-[12px] text-[#6B7280] truncate leading-tight">{replyingTo.preview}</p>
          </div>
          <button onClick={onCancelReply} className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-200 shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg bg-gray-50 border border-gray-100 pl-2 pr-1 py-1">
              {f.type.startsWith("image/") ? <ImageIcon className="w-3.5 h-3.5 text-[#FF561E]" /> : <FileText className="w-3.5 h-3.5 text-[#FF561E]" />}
              <span className="text-[12px] text-[#1A1D20] max-w-[120px] truncate">{f.name}</span>
              <button onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))} className="w-5 h-5 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-200">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2">
        <label title="Attach files" className="w-9 h-9 mb-1 rounded-lg flex items-center justify-center text-[#6B7280] hover:bg-[#FFF4F0] hover:text-[#FF561E] cursor-pointer shrink-0">
          <Paperclip className="w-5 h-5" />
          <input
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              pickFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
        <textarea
          ref={taRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            const mod = e.ctrlKey || e.metaKey;
            if (mod && (e.key === "b" || e.key === "B")) {
              e.preventDefault();
              wrapSelection("**");
              return;
            }
            if (mod && (e.key === "i" || e.key === "I")) {
              e.preventDefault();
              wrapSelection("*");
              return;
            }
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder={placeholder || "Type a message…"}
          className="flex-1 resize-none max-h-32 px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 outline-none focus:border-[#FF561E] focus:ring-2 focus:ring-[#FF561E]/10 text-[14px] transition-all"
        />
        <button
          onClick={submit}
          disabled={sending || disabled || (!text.trim() && files.length === 0)}
          className="w-11 h-11 rounded-full bg-[#FF561E] text-white flex items-center justify-center hover:bg-[#E04B18] transition-colors shrink-0 disabled:opacity-50"
        >
          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Chat thread (shared by customer + admin)                            */
/* ------------------------------------------------------------------ */

export interface ThreadMessage {
  id: number;
  sender: "user" | "admin";
  sender_name?: string | null;
  body: string | null;
  attachments: Attachment[];
  reply_to_id?: number | null;
  deleted_for_everyone?: boolean;
  read_at?: string | null;
  created_at: string;
}

export type DeleteScope = "me" | "everyone";

function QuotedBlock({ quoted, mine, viewerSide }: { quoted: ThreadMessage; mine: boolean; viewerSide: "user" | "admin" }) {
  const who = quoted.sender === viewerSide ? "You" : quoted.sender === "admin" ? quoted.sender_name || "Support" : "Customer";
  return (
    <div className={`mb-1 rounded-lg border-l-2 px-2 py-1 ${mine ? "bg-white/15 border-white/50" : "bg-gray-50 border-[#FF561E]/50"}`}>
      <p className={`text-[11px] font-bold leading-tight ${mine ? "text-white/90" : "text-[#FF561E]"}`}>{who}</p>
      <p className={`text-[11.5px] truncate leading-tight ${mine ? "text-white/75" : "text-[#6B7280]"}`}>
        {snippetOf(quoted.body, quoted.attachments, 60)}
      </p>
    </div>
  );
}

export function ChatThread({
  messages,
  viewerSide,
  onReply,
  onDelete,
}: {
  messages: ThreadMessage[];
  viewerSide: "user" | "admin";
  onReply?: (m: ThreadMessage) => void;
  onDelete?: (m: ThreadMessage, scope: DeleteScope) => void;
}) {
  const [openId, setOpenId] = useState<number | null>(null);
  let lastDay = "";
  const byId = new Map(messages.map((m) => [m.id, m]));
  return (
    <div className="flex flex-col gap-1.5">
      {openId !== null && <div className="fixed inset-0 z-10" onClick={() => setOpenId(null)} />}
      {messages.map((m) => {
        const mine = m.sender === viewerSide;
        const day = dayLabel(m.created_at);
        const showDay = day !== lastDay;
        lastDay = day;
        const quoted = m.reply_to_id ? byId.get(m.reply_to_id) : undefined;
        const deleted = Boolean(m.deleted_for_everyone);
        const actions =
          !deleted && (onReply || onDelete) ? (
            <MessageActions
              open={openId === m.id}
              onToggle={() => setOpenId(openId === m.id ? null : m.id)}
              mine={mine}
              canReply={Boolean(onReply)}
              canDelete={Boolean(onDelete)}
              onReply={() => {
                setOpenId(null);
                onReply?.(m);
              }}
              onDelete={(scope) => {
                setOpenId(null);
                onDelete?.(m, scope);
              }}
            />
          ) : null;
        return (
          <div key={m.id}>
            {showDay && (
              <div className="flex justify-center my-3">
                <span className="px-3 py-1 rounded-full bg-gray-100 text-[11px] font-semibold text-[#6B7280]">{day}</span>
              </div>
            )}
            <div className={`group flex items-center gap-1.5 ${mine ? "justify-end" : "justify-start"}`}>
              {mine && actions}
              <div
                className={`relative max-w-[80%] sm:max-w-[70%] rounded-2xl px-3.5 py-2 ${
                  deleted
                    ? "bg-gray-100 text-gray-500 rounded-2xl"
                    : mine
                    ? "bg-[#FF561E] text-white rounded-br-md"
                    : "bg-white text-[#1A1D20] border border-gray-100 rounded-bl-md shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
                }`}
              >
                {deleted ? (
                  <span className="flex items-center gap-1.5 text-[13px] italic">
                    <Ban className="w-3.5 h-3.5" /> This message was deleted
                  </span>
                ) : (
                  <>
                    {quoted && <QuotedBlock quoted={quoted} mine={mine} viewerSide={viewerSide} />}
                    {m.body && (
                      <FormattedText body={m.body} className={`text-[14px] leading-relaxed whitespace-pre-wrap break-words ${mine ? "text-white" : "text-[#1A1D20]"}`} />
                    )}
                    <AttachmentView attachments={m.attachments} mine={mine} />
                  </>
                )}
                <div className={`flex items-center gap-1 mt-1 ${mine ? "justify-end" : "justify-start"}`}>
                  <span className={`text-[10px] ${mine && !deleted ? "text-white/70" : "text-gray-400"}`}>{formatTime(m.created_at)}</span>
                  {mine && !deleted && <DeliveryTick read={Boolean(m.read_at)} />}
                </div>
              </div>
              {!mine && actions}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MessageActions({
  open,
  onToggle,
  mine,
  canReply,
  canDelete,
  onReply,
  onDelete,
}: {
  open: boolean;
  onToggle: () => void;
  mine: boolean;
  canReply: boolean;
  canDelete: boolean;
  onReply: () => void;
  onDelete: (scope: DeleteScope) => void;
}) {
  return (
    <div className="relative shrink-0">
      <button
        onClick={onToggle}
        title="Message options"
        className={`w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[#6B7280] hover:text-[#FF561E] hover:border-orange-200 transition-all ${
          open ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        <MoreVertical className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className={`absolute z-20 mt-1 w-44 bg-white rounded-xl border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden ${mine ? "right-0" : "left-0"}`}>
          {canReply && (
            <button onClick={onReply} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-medium text-[#374151] hover:bg-gray-50">
              <Reply className="w-4 h-4 text-[#6B7280]" /> Reply
            </button>
          )}
          {canDelete && (
            <button onClick={() => onDelete("me")} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-medium text-[#374151] hover:bg-gray-50">
              <Trash2 className="w-4 h-4 text-[#6B7280]" /> Delete for me
            </button>
          )}
          {canDelete && mine && (
            <button onClick={() => onDelete("everyone")} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-medium text-red-500 hover:bg-red-50">
              <Trash2 className="w-4 h-4" /> Delete for everyone
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Badge styling for a support ticket status. Shared by customer + admin views. */
export function ticketStatusPill(status: string) {
  const map: Record<string, string> = {
    open: "bg-amber-50 text-amber-600",
    answered: "bg-sky-50 text-sky-600",
    resolved: "bg-emerald-50 text-emerald-600",
    closed: "bg-gray-100 text-gray-500",
  };
  return map[status] || "bg-gray-100 text-gray-500";
}
