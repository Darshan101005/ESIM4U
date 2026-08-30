"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardTopbar from "@/components/dashboard/topbar";
import { Loader2, Plus, Ticket as TicketIcon, ChevronRight, ArrowLeft } from "lucide-react";

interface TicketRow {
  id: number;
  ticket_ref: string;
  title: string;
  subject: string | null;
  category: string | null;
  department: string | null;
  status: string;
  last_reply_by: string | null;
  last_reply_at: string | null;
  created_at: string;
  unread: boolean;
}

export function ticketStatusPill(status: string) {
  const map: Record<string, string> = {
    open: "bg-amber-50 text-amber-600",
    answered: "bg-sky-50 text-sky-600",
    resolved: "bg-emerald-50 text-emerald-600",
    closed: "bg-gray-100 text-gray-500",
  };
  return map[status] || "bg-gray-100 text-gray-500";
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/support/tickets", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { tickets: [] }))
      .then((d) => setTickets(d.tickets || []))
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <DashboardTopbar title="Support Tickets" />
      <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8 max-w-3xl mx-auto w-full">
        <div className="flex items-center justify-between mb-5">
          <Link href="/dashboard/support" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#6B7280] hover:text-[#FF561E]">
            <ArrowLeft className="w-4 h-4" /> Support
          </Link>
          <Link
            href="/dashboard/support/tickets/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF561E] text-white text-[13px] font-bold hover:bg-[#E04B18] transition-colors shadow-sm shadow-orange-500/25"
          >
            <Plus className="w-4 h-4" /> New Ticket
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-7 h-7 text-[#FF561E] animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <TicketIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-[14px] font-semibold text-[#1A1D20]">No tickets yet</p>
            <p className="text-[13px] text-[#6B7280] mt-1">Raise a ticket for issues that need tracking over 24 hours.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((t) => (
              <Link
                key={t.id}
                href={`/dashboard/support/tickets/${t.id}`}
                className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-4 hover:border-orange-200 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-[#FFF4F0] flex items-center justify-center shrink-0">
                  <TicketIcon className="w-5 h-5 text-[#FF561E]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] font-bold text-[#1A1D20] truncate">{t.title}</p>
                    {t.unread && <span className="w-2 h-2 rounded-full bg-[#FF561E] shrink-0" />}
                  </div>
                  <p className="text-[12px] text-[#6B7280] mt-0.5 truncate">
                    <span className="font-mono">{t.ticket_ref}</span>
                    {t.category ? ` · ${t.category}` : ""}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize shrink-0 ${ticketStatusPill(t.status)}`}>
                  {t.status}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
