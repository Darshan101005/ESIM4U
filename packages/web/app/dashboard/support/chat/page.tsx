"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, CheckCircle2, RotateCcw, Headset } from "lucide-react";
import toast from "react-hot-toast";
import { ChatThread, Composer, snippetOf, type ThreadMessage, type PendingAttachment, type ReplyTarget, type DeleteScope } from "@/components/support/shared";

interface Conversation {
  status: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

export default function CustomerChatPage() {
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [online, setOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastCountRef = useRef(0);

  const startReply = (m: ThreadMessage) =>
    setReplyTo({ id: m.id, who: m.sender === "user" ? "You" : "Support", preview: snippetOf(m.body, m.attachments) });

  const deleteMessage = async (m: ThreadMessage, scope: DeleteScope) => {
    try {
      const res = await fetch("/api/support/chat", {
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

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/support/chat", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages || []);
      setConversation(data.conversation || null);
      setOnline(Boolean(data.online));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [load]);

  // Auto-scroll to the newest message when the count grows.
  useEffect(() => {
    if (messages.length !== lastCountRef.current) {
      lastCountRef.current = messages.length;
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const send = async (body: string, attachments: PendingAttachment[]) => {
    try {
      const res = await fetch("/api/support/chat", {
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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send");
    }
  };

  // Customers can reopen a closed chat; only Support can mark it resolved.
  const reopen = async () => {
    try {
      const res = await fetch("/api/support/chat", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reopen" }),
      });
      if (!res.ok) throw new Error();
      toast.success("Chat reopened");
      await load();
    } catch {
      toast.error("Could not reopen the chat");
    }
  };

  const resolved = conversation?.status === "resolved";

  return (
    <div className="flex flex-col h-screen bg-[#F8F9FB]">
      {/* Header */}
      <header className="h-[70px] bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-6 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/dashboard/support" className="w-9 h-9 rounded-lg flex items-center justify-center text-[#6B7280] hover:bg-gray-100 shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF561E] to-[#FF7A45] flex items-center justify-center shrink-0">
            <Headset className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-bold text-[#1A1D20] leading-tight">eSIM4U Support</p>
            <p className="text-[12px] leading-tight flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${online ? "bg-emerald-500" : "bg-gray-300"}`} />
              <span className="text-[#6B7280]">{online ? "Online" : "Offline · usually replies within 1 hr"}</span>
            </p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 max-w-3xl w-full mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-7 h-7 text-[#FF561E] animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-[#FFF4F0] flex items-center justify-center mx-auto mb-3">
              <Headset className="w-7 h-7 text-[#FF561E]" />
            </div>
            <p className="text-[15px] font-bold text-[#1A1D20]">How can we help?</p>
            <p className="text-[13px] text-[#6B7280] mt-1 max-w-sm mx-auto">
              Send us a message and our team will reply. We usually respond within an hour during working hours.
            </p>
          </div>
        ) : (
          <ChatThread messages={messages} viewerSide="user" onReply={startReply} onDelete={deleteMessage} />
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer / resolved banner */}
      {resolved ? (
        <div className="bg-white border-t border-gray-100 px-4 lg:px-6 py-4 max-w-3xl w-full mx-auto">
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="text-[13px] text-[#6B7280] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Chat closed by Customer Support.
            </p>
            <button
              onClick={reopen}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF561E] text-white text-[13px] font-bold hover:bg-[#E04B18] transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Reopen chat
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl w-full mx-auto">
          <Composer onSend={send} placeholder="Type a message…" replyingTo={replyTo} onCancelReply={() => setReplyTo(null)} />
        </div>
      )}
    </div>
  );
}
