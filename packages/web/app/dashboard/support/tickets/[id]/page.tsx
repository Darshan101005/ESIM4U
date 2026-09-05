"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import DashboardTopbar from "@/components/dashboard/topbar";
import { ArrowLeft, Loader2, Headset, User } from "lucide-react";
import toast from "react-hot-toast";
import { FormattedText, AttachmentView, Composer, formatTime, dayLabel, ticketStatusPill, type Attachment, type PendingAttachment } from "@/components/support/shared";

interface TicketMsg {
  id: number;
  sender: "user" | "admin";
  sender_name: string | null;
  body: string | null;
  attachments: Attachment[];
  created_at: string;
}
interface TicketData {
  ticket: {
    id: number;
    ticket_ref: string;
    title: string;
    subject: string | null;
    category: string | null;
    department: string | null;
    status: string;
    created_at: string;
  };
  messages: TicketMsg[];
}

export default function CustomerTicketDetail() {
  const params = useParams();
  const id = String(params.id);
  const [data, setData] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/support/tickets/${id}`, { cache: "no-store" });
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) return;
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    const t = setInterval(load, 6000);
    return () => clearInterval(t);
  }, [load]);

  const reply = async (body: string, attachments: PendingAttachment[]) => {
    try {
      const res = await fetch(`/api/support/tickets/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, attachments: attachments.map((a) => ({ dataUri: a.dataUri, name: a.name })) }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Could not send");
      }
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send");
    }
  };

  const t = data?.ticket;
  const closed = t?.status === "closed";
  let lastDay = "";

  return (
    <>
      <DashboardTopbar title="Ticket" />
      <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8 max-w-3xl mx-auto w-full">
        <Link href="/dashboard/support/tickets" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#6B7280] hover:text-[#FF561E] mb-5">
          <ArrowLeft className="w-4 h-4" /> All tickets
        </Link>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-7 h-7 text-[#FF561E] animate-spin" />
          </div>
        ) : notFound || !t ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <p className="text-[14px] font-semibold text-[#1A1D20]">Ticket not found</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 mb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-[17px] font-bold text-[#1A1D20]">{t.title}</h2>
                  <p className="text-[12px] text-[#6B7280] mt-1 font-mono">{t.ticket_ref}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize shrink-0 ${ticketStatusPill(t.status)}`}>{t.status}</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {t.subject && <Meta label="Subject" value={t.subject} />}
                {t.category && <Meta label="Problem" value={t.category} />}
                {t.department && <Meta label="Department" value={t.department} />}
              </div>
            </div>

            <div className="space-y-4 mb-4">
              {data!.messages.map((m) => {
                const day = dayLabel(m.created_at);
                const showDay = day !== lastDay;
                lastDay = day;
                const admin = m.sender === "admin";
                return (
                  <div key={m.id}>
                    {showDay && (
                      <div className="flex justify-center my-3">
                        <span className="px-3 py-1 rounded-full bg-gray-100 text-[11px] font-semibold text-[#6B7280]">{day}</span>
                      </div>
                    )}
                    <div className={`rounded-2xl border p-4 ${admin ? "bg-[#FFF9F6] border-[#FFE2D6]" : "bg-white border-gray-100"}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${admin ? "bg-[#FF561E]" : "bg-gray-200"}`}>
                          {admin ? <Headset className="w-3.5 h-3.5 text-white" /> : <User className="w-3.5 h-3.5 text-[#6B7280]" />}
                        </div>
                        <span className="text-[13px] font-bold text-[#1A1D20]">{admin ? m.sender_name || "Support" : "You"}</span>
                        <span className="text-[11px] text-gray-400 ml-auto">{formatTime(m.created_at)}</span>
                      </div>
                      {m.body && <FormattedText body={m.body} className="text-[14px] leading-relaxed text-[#374151] whitespace-pre-wrap break-words" />}
                      <AttachmentView attachments={m.attachments} mine={false} />
                    </div>
                  </div>
                );
              })}
            </div>

            {closed ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center text-[13px] text-[#6B7280]">
                This ticket is closed. Raise a new ticket if you need more help.
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
                <Composer onSend={reply} placeholder="Write a reply…" />
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-100 text-[11.5px]">
      <span className="text-gray-400">{label}:</span>
      <span className="font-semibold text-[#374151]">{value}</span>
    </span>
  );
}
