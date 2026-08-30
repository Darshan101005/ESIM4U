"use client";

import DashboardTopbar from "@/components/dashboard/topbar";
import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { Loader2, ArrowLeftRight, ArrowUpRight, CreditCard, Hash, Receipt, ExternalLink, RotateCcw, Info } from "lucide-react";
import { CURRENCY_SYMBOLS, SupportedCurrency } from "@/lib/fx";
import { buildPaymentRows, type PaymentRow } from "@/lib/payment-details";

interface Transaction {
  id: number;
  bundle_name?: string;
  country?: string;
  order_reference: string;
  stripe_session_id?: string;
  stripe_payment_intent?: string;
  display_currency?: string;
  display_rate?: string;
  card_brand?: string;
  card_last4?: string;
  card_wallet?: string;
  payment_method_type?: string;
  receipt_url?: string;
  paypal_order_id?: string;
  paypal_capture_id?: string;
  bank_transfer_reference?: string;
  price: string;
  status: string;
  created_at: string;
}

type TxFilter = "all" | "completed" | "pending" | "refunded" | "failed" | "cancelled";

const FILTERS: { key: TxFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "completed", label: "Completed" },
  { key: "pending", label: "Pending" },
  { key: "refunded", label: "Refunded" },
  { key: "failed", label: "Failed" },
  { key: "cancelled", label: "Cancelled" },
];

function normalizeStatus(status: string): TxFilter {
  if (status === "completed") return "completed";
  if (status === "pending" || status === "processing" || status === "pending_verification" || status === "on_hold")
    return "pending";
  if (status === "refunded") return "refunded";
  if (status === "cancelled") return "cancelled";
  return "failed"; // failed + refund_failed + rejected
}

function pillMeta(status: string): { label: string; cls: string } {
  switch (status) {
    case "completed":
      return { label: "Completed", cls: "bg-emerald-50 text-emerald-600" };
    case "pending":
      return { label: "Pending", cls: "bg-amber-50 text-amber-600" };
    case "processing":
      return { label: "Processing", cls: "bg-blue-50 text-blue-600" };
    case "pending_verification":
      return { label: "Pending Verification", cls: "bg-amber-50 text-amber-600" };
    case "on_hold":
      return { label: "On Hold", cls: "bg-gray-100 text-[#6B7280]" };
    case "rejected":
      return { label: "Rejected", cls: "bg-red-50 text-red-500" };
    case "refunded":
      return { label: "Refunded", cls: "bg-blue-50 text-blue-600" };
    case "refund_failed":
      return { label: "Refund Failed", cls: "bg-red-50 text-red-500" };
    case "cancelled":
      return { label: "Cancelled", cls: "bg-gray-100 text-[#6B7280]" };
    case "failed":
      return { label: "Failed", cls: "bg-red-50 text-red-500" };
    default:
      return { label: status, cls: "bg-gray-100 text-[#6B7280]" };
  }
}

// Shows the amount in the currency the customer actually purchased in (locked at
// purchase time via display_currency + display_rate). Does not change with the toggle.
function lockedAmount(t: Transaction): string {
  const cur = (t.display_currency || "USD") as SupportedCurrency;
  const rate = t.display_rate ? parseFloat(t.display_rate) : 1;
  const symbol = CURRENCY_SYMBOLS[cur] ?? "";
  const value = parseFloat(t.price) * rate;
  return `${symbol}${value.toFixed(2)}`;
}

function chipClass(active: boolean) {
  return active
    ? "bg-[#FFF4F0] text-[#FF561E] border-[#FF561E]"
    : "bg-white text-[#6B7280] border-gray-200 hover:text-[#FF561E] hover:border-orange-200";
}

function iconForRow(row: PaymentRow) {
  if (row.href) return Receipt;
  if (row.label.includes("Method")) return CreditCard;
  if (row.label.includes("Refund")) return RotateCcw;
  if (row.label === "Reason") return Info;
  return Hash;
}

function PaymentDetailRow({ row }: { row: PaymentRow }) {
  const Icon = iconForRow(row);
  const fullWidth = row.label === "Reason" || !!row.href;
  return (
    <div className={`flex items-center gap-2.5 ${fullWidth ? "sm:col-span-2" : ""}`}>
      <Icon className="w-4 h-4 text-[#6B7280] shrink-0" strokeWidth={2} />
      <div className="min-w-0">
        <p className="text-[11px] text-[#6B7280]">{row.label}</p>
        {row.href ? (
          <a
            href={row.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12.5px] font-semibold text-[#FF561E] hover:text-[#E04B18] inline-flex items-center gap-1"
          >
            {row.value} <ExternalLink className="w-3.5 h-3.5" />
          </a>
        ) : (
          <p className={`text-[12.5px] font-semibold text-[#1A1D20] truncate ${row.mono ? "font-mono" : ""}`}>{row.value}</p>
        )}
      </div>
    </div>
  );
}

export default function TransactionsPage() {
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TxFilter>("all");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTxns(data.orders || []);
    } catch {
      setTxns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const c: Record<TxFilter, number> = { all: txns.length, completed: 0, pending: 0, refunded: 0, failed: 0, cancelled: 0 };
    for (const t of txns) c[normalizeStatus(t.status)]++;
    return c;
  }, [txns]);

  const filtered = useMemo(
    () => (filter === "all" ? txns : txns.filter((t) => normalizeStatus(t.status) === filter)),
    [txns, filter]
  );

  return (
    <>
      <DashboardTopbar title="Transactions" />
      <main className="flex-1 px-4 lg:px-16 xl:px-24 py-6 lg:py-8 max-w-6xl mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#FF561E] animate-spin" />
          </div>
        ) : txns.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 max-w-3xl">
            <ArrowLeftRight className="w-12 h-12 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-[15px] font-semibold text-[#1A1D20]">No transactions yet</p>
            <p className="text-[13px] text-[#6B7280] mt-1 mb-4">Your payments will appear here.</p>
            <Link href="/dashboard/browse" className="text-[13px] text-[#FF561E] font-semibold">Browse eSIM Plans</Link>
          </div>
        ) : (
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 mb-5">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold border transition-colors ${chipClass(filter === f.key)}`}
                >
                  {f.label}
                  <span className={`text-[11px] font-bold ${filter === f.key ? "text-[#FF561E]/70" : "text-gray-400"}`}>{counts[f.key]}</span>
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <p className="text-[14px] text-[#6B7280] font-medium">No {filter} transactions.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((t) => {
                  const pill = pillMeta(t.status);
                  const rows = buildPaymentRows(t, "customer");
                  return (
                    <div key={t.id} className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-[#FFF4F0] flex items-center justify-center shrink-0">
                            <ArrowUpRight className="w-5 h-5 text-[#FF561E]" strokeWidth={2.2} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[14px] font-semibold text-[#1A1D20] truncate">{t.bundle_name || t.country || "eSIM purchase"}</p>
                            <p className="text-[11.5px] text-[#6B7280]">{new Date(t.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <p className="text-[15px] font-bold text-[#1A1D20]">{lockedAmount(t)}</p>
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${pill.cls}`}>{pill.label}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {rows.map((r, i) => (
                          <PaymentDetailRow key={i} row={r} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
