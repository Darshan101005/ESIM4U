"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AdminTopbar from "@/components/admin/admin-topbar";
import { Loader2, MessageSquare, Ticket as TicketIcon, CheckCircle2, RotateCcw, Search, User, Headset, ArrowLeft, Maximize2, Minimize2, Trash2, Eye } from "lucide-react";
import toast from "react-hot-toast";
import {
  ChatThread,
  Composer,
  FormattedText,
  AttachmentView,
  snippetOf,
  formatTime,
  whatsappListTime,
  dayLabel,
  type ThreadMessage,
  type Attachment,
  type PendingAttachment,
  type ReplyTarget,
  type DeleteScope,
} from "@/components/support/shared";
import { ticketStatusPill } from "@/app/dashboard/support/tickets/page";
import AdminNotificationBell from "@/components/admin/admin-notification-bell";
import CustomerDetailsDrawer from "@/components/admin/customer-details-drawer";

type Tab = "chats" | "tickets";

interface Conversation {
  user_id: string;
  user_email: string | null;
  customer_name: string | null;
  status: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  last_sender: string | null;
  unread: number;
}

interface TicketRow {
  id: number;
  ticket_ref: string;
  user_email: string | null;
  customer_name: string | null;
  title: string;
  category: string | null;
  department: string | null;
  status: string;
  unread: boolean;
}

function initialOf(name?: string | null, email?: string | null) {
  return (name || email || "?").trim().charAt(0).toUpperCase();
}

export default function AdminSupportPage() {
  const [tab, setTab] = useState<Tab>("chats");
  const [expanded, setExpanded] = useState(false);

  // Honor a ?tab=tickets deep link (e.g. from the notification bell).
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t === "tickets") setTab("tickets");
  }, []);

  // Heartbeat so customers see the "online" indicator while an admin is here.
  useEffect(() => {
    const ping = () => fetch("/api/admin/support/presence", { method: "POST" }).catch(() => {});
    ping();
    const t = setInterval(ping, 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      {!expanded && <AdminTopbar title="Support" right={<AdminNotificationBell />} />}
      <main className="flex-1 flex flex-col min-h-0">
        {/* The tab switcher is hidden while a chat is expanded, to give it more room. */}
        {!expanded && (
          <div className="px-4 lg:px-8 pt-4">
            <div className="inline-flex rounded-xl bg-gray-100 p-1">
              <button
                onClick={() => setTab("chats")}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
                  tab === "chats" ? "bg-white text-[#FF561E] shadow-sm" : "text-[#6B7280]"
                }`}
              >
                <MessageSquare className="w-4 h-4" /> Live Chats
              </button>
              <button
                onClick={() => setTab("tickets")}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
                  tab === "tickets" ? "bg-white text-[#FF561E] shadow-sm" : "text-[#6B7280]"
                }`}
              >
                <TicketIcon className="w-4 h-4" /> Tickets
              </button>
            </div>
          </div>
        )}

        <div className={`flex-1 min-h-0 ${expanded ? "p-0" : "p-4 lg:p-6"}`}>
          {tab === "chats" ? <ChatsPanel expanded={expanded} setExpanded={setExpanded} /> : <TicketsPanel />}
        </div>
      </main>
    </>
  );
}

/* ================================================================== */
/* Live chats                                                          */
/* ================================================================== */

function ChatsPanel({ expanded, setExpanded }: { expanded: boolean; setExpanded: (v: boolean) => void }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [loadingList, setLoadingList] = useState(true);

  const loadList = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/support/conversations", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setConversations(data.conversations || []);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadList();
    const t = setInterval(loadList, 5000);
    return () => clearInterval(t);
  }, [loadList]);

  const filtered = conversations.filter((c) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (c.customer_name || "").toLowerCase().includes(q) || (c.user_email || "").toLowerCase().includes(q);
  });

  const activeConv = conversations.find((c) => c.user_id === active) || null;

  return (
    <div
      className={
        expanded
          ? "h-screen bg-white overflow-hidden flex"
          : "h-[calc(100vh-190px)] bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden flex"
      }
    >
      {/* Conversation list (hidden while the chat is expanded to fullscreen) */}
      <aside className={`w-full md:w-[320px] border-r border-gray-100 flex-col ${expanded ? "hidden" : active ? "hidden md:flex" : "flex"}`}>
        <div className="p-3 border-b border-gray-100">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search customers…"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-[#FF561E] text-[13px]"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingList ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-[#FF561E] animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 px-4">
              <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-[13px] text-[#6B7280]">No conversations yet</p>
            </div>
          ) : (
            filtered.map((c) => (
              <button
                key={c.user_id}
                onClick={() => setActive(c.user_id)}
                className={`w-full flex items-center gap-3 px-3 py-3 border-b border-gray-50 text-left hover:bg-gray-50 transition-colors ${
                  active === c.user_id ? "bg-[#FFF4F0]" : ""
                }`}
              >
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#FF561E] to-[#FF7A45] flex items-center justify-center text-white font-bold shrink-0">
                  {initialOf(c.customer_name, c.user_email)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[13.5px] font-bold text-[#1A1D20] truncate">{c.customer_name || c.user_email || "Customer"}</p>
                    {c.last_message_at && (
                      <span className="text-[10px] text-gray-400 ml-auto shrink-0">{whatsappListTime(c.last_message_at)}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-[12px] text-[#6B7280] truncate flex-1">
                      {c.last_sender === "admin" ? "You: " : ""}
                      {c.last_message_preview || "…"}
                    </p>
                    {c.unread > 0 && (
                      <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#FF561E] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {c.unread}
                      </span>
                    )}
                  </div>
                  {c.status === "resolved" && <span className="text-[10px] text-emerald-600 font-semibold">Resolved</span>}
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Chat panel */}
      <section className={`flex-1 min-w-0 ${active ? "flex" : "hidden md:flex"} flex-col`}>
        {activeConv ? (
          <AdminChatPanel
            conversation={activeConv}
            onBack={() => setActive(null)}
            onChanged={loadList}
            expanded={expanded}
            onToggleExpand={() => setExpanded(!expanded)}
            onDeleted={() => {
              setExpanded(false);
              setActive(null);
              loadList();
            }}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-[#FFF4F0] flex items-center justify-center mb-3">
              <Headset className="w-8 h-8 text-[#FF561E]" />
            </div>
            <p className="text-[15px] font-bold text-[#1A1D20]">Select a conversation</p>
            <p className="text-[13px] text-[#6B7280] mt-1">Choose a customer on the left to view and reply to their chat.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function AdminChatPanel({
  conversation,
  onBack,
  onChanged,
  expanded,
  onToggleExpand,
  onDeleted,
}: {
  conversation: Conversation;
  onBack: () => void;
  onChanged: () => void;
  expanded: boolean;
  onToggleExpand: () => void;
  onDeleted: () => void;
}) {
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [status, setStatus] = useState(conversation.status);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastCountRef = useRef(0);
  const userId = conversation.user_id;

  const startReply = (m: ThreadMessage) =>
    setReplyTo({ id: m.id, who: m.sender === "admin" ? "You" : conversation.customer_name || "Customer", preview: snippetOf(m.body, m.attachments) });

  const deleteMessage = async (m: ThreadMessage, scope: DeleteScope) => {
    try {
      const res = await fetch(`/api/admin/support/chat/${encodeURIComponent(userId)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: m.id, scope }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Could not delete");
      }
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete");
    }
  };

  const deleteEntireChat = async () => {
    if (!window.confirm("Delete this entire conversation? This removes all messages and files permanently.")) return;
    try {
      const res = await fetch(`/api/admin/support/chat/${encodeURIComponent(userId)}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Conversation deleted");
      onDeleted();
    } catch {
      toast.error("Could not delete the conversation");
    }
  };

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/support/chat/${encodeURIComponent(userId)}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages || []);
      if (data.conversation?.status) setStatus(data.conversation.status);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (messages.length !== lastCountRef.current) {
      lastCountRef.current = messages.length;
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const send = async (body: string, attachments: PendingAttachment[]) => {
    try {
      const res = await fetch(`/api/admin/support/chat/${encodeURIComponent(userId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body,
          attachments: attachments.map((a) => ({ dataUri: a.dataUri, name: a.name })),
          reply_to_id: replyTo?.id ?? null,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Could not send");
      }
      setReplyTo(null);
      await load();
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send");
    }
  };

  const setConvState = async (action: "resolve" | "reopen") => {
    try {
      const res = await fetch(`/api/admin/support/chat/${encodeURIComponent(userId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error();
      setStatus(action === "resolve" ? "resolved" : "open");
      toast.success(action === "resolve" ? "Marked resolved" : "Reopened");
      onChanged();
    } catch {
      toast.error("Could not update");
    }
  };

  const resolved = status === "resolved";

  return (
    <>
      <div className="h-[64px] border-b border-gray-100 flex items-center justify-between px-4 shrink-0 gap-2">
        <button onClick={() => setShowDetails(true)} className="flex items-center gap-3 min-w-0 text-left group/name" title="View customer details">
          <span className="md:hidden" onClick={(e) => { e.stopPropagation(); onBack(); }}>
            <ArrowLeft className="w-5 h-5 text-[#6B7280]" />
          </span>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF561E] to-[#FF7A45] flex items-center justify-center text-white font-bold shrink-0">
            {initialOf(conversation.customer_name, conversation.user_email)}
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-bold text-[#1A1D20] truncate group-hover/name:text-[#FF561E] transition-colors">{conversation.customer_name || "Customer"}</p>
            <p className="text-[12px] text-[#6B7280] truncate">{conversation.user_email}</p>
          </div>
        </button>
        <div className="flex items-center gap-1.5 shrink-0">
          {resolved ? (
            <button onClick={() => setConvState("reopen")} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-[12.5px] font-semibold text-[#6B7280] hover:text-[#FF561E] hover:border-orange-200 transition-colors">
              <RotateCcw className="w-4 h-4" /> Reopen
            </button>
          ) : (
            <button onClick={() => setConvState("resolve")} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-[12.5px] font-semibold text-[#6B7280] hover:text-emerald-600 hover:border-emerald-200 transition-colors">
              <CheckCircle2 className="w-4 h-4" /> Resolve
            </button>
          )}
          <button onClick={onToggleExpand} title={expanded ? "Minimize" : "Expand"} className="w-9 h-9 rounded-xl flex items-center justify-center text-[#6B7280] hover:bg-[#FFF4F0] hover:text-[#FF561E] transition-colors">
            {expanded ? <Minimize2 className="w-[17px] h-[17px]" /> : <Maximize2 className="w-[17px] h-[17px]" />}
          </button>
          <button onClick={deleteEntireChat} title="Delete entire chat" className="w-9 h-9 rounded-xl flex items-center justify-center text-[#6B7280] hover:bg-red-50 hover:text-red-500 transition-colors">
            <Trash2 className="w-[17px] h-[17px]" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 bg-[#F8F9FB]">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-[#FF561E] animate-spin" />
          </div>
        ) : (
          <ChatThread messages={messages} viewerSide="admin" onReply={startReply} onDelete={deleteMessage} />
        )}
        <div ref={bottomRef} />
      </div>

      {resolved ? (
        <div className="border-t border-gray-100 bg-white px-4 py-4 text-center">
          <p className="text-[13px] text-[#6B7280] flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> This chat is marked resolved. Reopen to reply.
          </p>
        </div>
      ) : (
        <Composer onSend={send} placeholder="Reply to the customer…" replyingTo={replyTo} onCancelReply={() => setReplyTo(null)} />
      )}

      {showDetails && <CustomerDetailsDrawer userId={userId} onClose={() => setShowDetails(false)} />}
    </>
  );
}

/* ================================================================== */
/* Tickets                                                             */
/* ================================================================== */

function TicketsPanel() {
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const url = statusFilter ? `/api/admin/support/tickets?status=${statusFilter}` : "/api/admin/support/tickets";
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setTickets(data.tickets || []);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [load]);

  return (
    <div className="h-[calc(100vh-190px)] bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden flex">
      <aside className={`w-full md:w-[340px] border-r border-gray-100 flex flex-col ${active ? "hidden md:flex" : "flex"}`}>
        <div className="p-3 border-b border-gray-100 flex gap-1.5 flex-wrap">
          {["", "open", "answered", "resolved", "closed"].map((s) => (
            <button
              key={s || "all"}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold capitalize transition-colors ${
                statusFilter === s ? "bg-[#FF561E] text-white" : "bg-gray-50 text-[#6B7280] hover:text-[#FF561E]"
              }`}
            >
              {s || "All"}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-[#FF561E] animate-spin" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-16 px-4">
              <TicketIcon className="w-10 h-10 text-gray-200 mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-[13px] text-[#6B7280]">No tickets</p>
            </div>
          ) : (
            tickets.map((t) => (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={`w-full px-4 py-3 border-b border-gray-50 text-left hover:bg-gray-50 transition-colors ${active === t.id ? "bg-[#FFF4F0]" : ""}`}
              >
                <div className="flex items-center gap-2">
                  <p className="text-[13.5px] font-bold text-[#1A1D20] truncate flex-1">{t.title}</p>
                  {t.unread && <span className="w-2 h-2 rounded-full bg-[#FF561E] shrink-0" />}
                </div>
                <p className="text-[11.5px] text-[#6B7280] mt-0.5 truncate">
                  <span className="font-mono">{t.ticket_ref}</span> · {t.customer_name || t.user_email || "Customer"}
                </p>
                <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${ticketStatusPill(t.status)}`}>{t.status}</span>
              </button>
            ))
          )}
        </div>
      </aside>

      <section className={`flex-1 min-w-0 ${active ? "flex" : "hidden md:flex"} flex-col`}>
        {active ? (
          <AdminTicketPanel ticketId={active} onBack={() => setActive(null)} onChanged={load} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-[#FFF4F0] flex items-center justify-center mb-3">
              <TicketIcon className="w-8 h-8 text-[#FF561E]" />
            </div>
            <p className="text-[15px] font-bold text-[#1A1D20]">Select a ticket</p>
            <p className="text-[13px] text-[#6B7280] mt-1">Choose a ticket on the left to view and reply.</p>
          </div>
        )}
      </section>
    </div>
  );
}

interface TicketMsg {
  id: number;
  sender: "user" | "admin";
  sender_name: string | null;
  body: string | null;
  attachments: Attachment[];
  created_at: string;
}

function AdminTicketPanel({ ticketId, onBack, onChanged }: { ticketId: number; onBack: () => void; onChanged: () => void }) {
  const [ticket, setTicket] = useState<{ id: number; ticket_ref: string; user_id: string; title: string; subject: string | null; category: string | null; department: string | null; status: string; customer_name: string | null; user_email: string | null } | null>(null);
  const [messages, setMessages] = useState<TicketMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/support/tickets/${ticketId}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setTicket(data.ticket);
      setMessages(data.messages || []);
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    setLoading(true);
    load();
    const t = setInterval(load, 6000);
    return () => clearInterval(t);
  }, [load]);

  const reply = async (body: string, attachments: PendingAttachment[]) => {
    try {
      const res = await fetch(`/api/admin/support/tickets/${ticketId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, attachments: attachments.map((a) => ({ dataUri: a.dataUri, name: a.name })) }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Could not send");
      }
      await load();
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send");
    }
  };

  const changeStatus = async (status: string) => {
    try {
      const res = await fetch(`/api/admin/support/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      await load();
      onChanged();
    } catch {
      toast.error("Could not update status");
    }
  };

  let lastDay = "";

  return (
    <>
      <div className="border-b border-gray-100 px-4 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-[#6B7280] hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-bold text-[#1A1D20] truncate">{ticket?.title || "Ticket"}</p>
            <p className="text-[11.5px] text-[#6B7280] truncate">
              <span className="font-mono">{ticket?.ticket_ref}</span>
              {ticket?.customer_name || ticket?.user_email ? ` · ${ticket?.customer_name || ticket?.user_email}` : ""}
            </p>
          </div>
          {ticket && (
            <button
              onClick={() => setShowDetails(true)}
              title="View customer details"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 text-[12px] font-semibold text-[#6B7280] hover:text-[#FF561E] hover:border-orange-200 transition-colors shrink-0"
            >
              <Eye className="w-3.5 h-3.5" /> Customer
            </button>
          )}
          {ticket && (
            <select
              value={ticket.status}
              onChange={(e) => changeStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-[12px] font-semibold text-[#374151] outline-none focus:border-[#FF561E] capitalize shrink-0"
            >
              {["open", "answered", "resolved", "closed"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
        </div>
        {ticket && (ticket.category || ticket.department || ticket.subject) && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {ticket.subject && <MiniMeta label="Subject" value={ticket.subject} />}
            {ticket.category && <MiniMeta label="Problem" value={ticket.category} />}
            {ticket.department && <MiniMeta label="Dept" value={ticket.department} />}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 bg-[#F8F9FB] space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-[#FF561E] animate-spin" />
          </div>
        ) : (
          messages.map((m) => {
            const day = dayLabel(m.created_at);
            const showDay = day !== lastDay;
            lastDay = day;
            const admin = m.sender === "admin";
            return (
              <div key={m.id}>
                {showDay && (
                  <div className="flex justify-center my-2">
                    <span className="px-3 py-1 rounded-full bg-gray-200/70 text-[11px] font-semibold text-[#6B7280]">{day}</span>
                  </div>
                )}
                <div className={`rounded-2xl border p-3.5 ${admin ? "bg-white border-gray-100" : "bg-[#FFF9F6] border-[#FFE2D6]"}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${admin ? "bg-[#FF561E]" : "bg-gray-200"}`}>
                      {admin ? <Headset className="w-3 h-3 text-white" /> : <User className="w-3 h-3 text-[#6B7280]" />}
                    </div>
                    <span className="text-[12.5px] font-bold text-[#1A1D20]">{admin ? m.sender_name || "You" : ticket?.customer_name || "Customer"}</span>
                    <span className="text-[11px] text-gray-400 ml-auto">{formatTime(m.created_at)}</span>
                  </div>
                  {m.body && <FormattedText body={m.body} className="text-[13.5px] leading-relaxed text-[#374151] whitespace-pre-wrap break-words" />}
                  <AttachmentView attachments={m.attachments} mine={false} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {ticket?.status === "closed" ? (
        <div className="border-t border-gray-100 bg-white px-4 py-4 text-center text-[13px] text-[#6B7280]">
          This ticket is closed. Set it to Open to reply.
        </div>
      ) : (
        <Composer onSend={reply} placeholder="Reply to the customer…" />
      )}

      {showDetails && ticket && <CustomerDetailsDrawer userId={ticket.user_id} onClose={() => setShowDetails(false)} />}
    </>
  );
}

function MiniMeta({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-50 border border-gray-100 text-[11px]">
      <span className="text-gray-400">{label}:</span>
      <span className="font-semibold text-[#374151]">{value}</span>
    </span>
  );
}
