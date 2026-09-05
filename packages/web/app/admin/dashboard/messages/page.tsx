"use client";

import { useCallback, useEffect, useState } from "react";
import AdminTopbar from "@/components/admin/admin-topbar";
import { Mail, Loader2, Inbox } from "lucide-react";
import toast from "react-hot-toast";

interface ContactMessage {
  id: number;
  ref: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  user_id: string | null;
  status: "new" | "read" | "replied" | "closed";
  created_at: string;
}

const FILTERS = ["all", "new", "read", "replied", "closed"] as const;
type Filter = (typeof FILTERS)[number];

const statusStyle: Record<string, string> = {
  new: "bg-orange-50 text-[#FF561E] border-orange-100",
  read: "bg-blue-50 text-blue-600 border-blue-100",
  replied: "bg-emerald-50 text-emerald-600 border-emerald-100",
  closed: "bg-gray-100 text-gray-500 border-gray-200",
};

export default function AdminMessagesPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/contact?status=${filter}`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages(data.messages || []);
      setCounts(data.counts || {});
    } catch {
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (id: number, status: string) => {
    try {
      const res = await fetch("/api/admin/contact", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error();
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status: status as ContactMessage["status"] } : m)));
      toast.success(`Marked ${status}`);
    } catch {
      toast.error("Update failed");
    }
  };

  const totalNew = counts.new || 0;

  return (
    <>
      <AdminTopbar title="Messages" />
      <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8 w-full max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <p className="text-[14px] text-[#6B7280]">Contact form submissions from the website.</p>
          </div>
          {totalNew > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 text-[#FF561E] text-[13px] font-semibold border border-orange-100">
              <Inbox className="w-4 h-4" /> {totalNew} new
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mb-5 overflow-x-auto hide-scrollbar">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors capitalize ${
                filter === f ? "bg-[#FF561E] text-white" : "bg-white border border-gray-200 text-[#6B7280] hover:border-[#FF561E]/40"
              }`}
            >
              {f}
              {f !== "all" && counts[f] ? ` (${counts[f]})` : ""}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#FF561E] animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Inbox className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-[15px] font-semibold text-[#1A1D20]">No messages</p>
            <p className="text-[13px] text-[#6B7280]">Contact submissions will appear here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((m) => {
              const open = openId === m.id;
              return (
                <div key={m.id} className="rounded-2xl border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
                  <button
                    onClick={() => {
                      setOpenId(open ? null : m.id);
                      if (!open && m.status === "new") setStatus(m.id, "read");
                    }}
                    className="w-full flex items-center gap-4 p-4 text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF561E] to-[#FF7A45] flex items-center justify-center text-white font-bold text-[15px] shrink-0">
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[14px] font-bold text-[#1A1D20] truncate">{m.name}</p>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusStyle[m.status]}`}>{m.status}</span>
                      </div>
                      <p className="text-[12.5px] text-[#6B7280] truncate">{m.subject || "General enquiry"} · {m.email}</p>
                    </div>
                    <span className="text-[11px] text-[#9CA3AF] shrink-0">{new Date(m.created_at).toLocaleDateString()}</span>
                  </button>

                  {open && (
                    <div className="px-4 pb-4 border-t border-gray-50 pt-4">
                      <p className="text-[11px] text-[#9CA3AF] mb-2">Ref {m.ref} · {new Date(m.created_at).toLocaleString()}</p>
                      <p className="text-[14px] text-[#374151] leading-relaxed whitespace-pre-wrap mb-4">{m.message}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <a
                          href={`mailto:${m.email}?subject=${encodeURIComponent("Re: " + (m.subject || "your enquiry"))}`}
                          onClick={() => setStatus(m.id, "replied")}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FF561E] text-white text-[13px] font-semibold"
                        >
                          <Mail className="w-4 h-4" /> Reply by email
                        </a>
                        <button onClick={() => setStatus(m.id, "replied")} className="px-4 py-2 rounded-full border border-gray-200 text-[13px] font-semibold text-[#6B7280] hover:border-emerald-300 hover:text-emerald-600 transition-colors">Mark replied</button>
                        <button onClick={() => setStatus(m.id, "closed")} className="px-4 py-2 rounded-full border border-gray-200 text-[13px] font-semibold text-[#6B7280] hover:border-gray-400 transition-colors">Close</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
