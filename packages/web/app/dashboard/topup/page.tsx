"use client";

import DashboardTopbar from "@/components/dashboard/topbar";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Wallet,
  Zap,
  ShieldCheck,
  Loader2,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  Gift,
  CreditCard,
  ShoppingBag,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import { notFound } from "next/navigation";
import { useCurrency } from "@/lib/currency-context";
import { useSiteSettings } from "@/lib/use-site-settings";
import { CURRENCY_SYMBOLS } from "@/lib/fx";

type WalletDirection = "credit" | "debit";
type WalletReason = "topup" | "purchase" | "refund" | "referral" | "admin_credit" | "admin_debit";

interface WalletTx {
  id: number;
  direction: WalletDirection;
  reason: WalletReason;
  amount_usd: string;
  display_currency: string | null;
  display_amount: string | null;
  description: string | null;
  created_at: string;
}

const PRESETS = [10, 25, 50, 100];
const DEFAULT_AMOUNT = 10;

type HistFilter = "current_month" | "previous_month" | "last_6_months" | "all";

const HIST_FILTERS: { key: HistFilter; label: string }[] = [
  { key: "current_month", label: "Current Month" },
  { key: "previous_month", label: "Last Month" },
  { key: "last_6_months", label: "Last 6 Months" },
  { key: "all", label: "All Time" },
];

function inPeriod(iso: string, f: HistFilter): boolean {
  if (f === "all") return true;
  const d = new Date(iso);
  const now = new Date();
  if (f === "current_month") return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  if (f === "previous_month") {
    const pm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.getFullYear() === pm.getFullYear() && d.getMonth() === pm.getMonth();
  }
  // last_6_months — from the start of the month 5 months ago through now (6 calendar months).
  const cutoff = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  return d >= cutoff;
}

const REASON_META: Record<WalletReason, { label: string; icon: typeof Wallet }> = {
  topup: { label: "Top-up", icon: Wallet },
  purchase: { label: "eSIM purchase", icon: ShoppingBag },
  refund: { label: "Refund", icon: RotateCcw },
  referral: { label: "Referral reward", icon: Gift },
  admin_credit: { label: "Credit added", icon: CreditCard },
  admin_debit: { label: "Adjustment", icon: ArrowUpRight },
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

function formatSyncTime(d: Date): string {
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function TopUpPage() {
  const { currency, format } = useCurrency();
  const settings = useSiteSettings();

  const [balanceUsd, setBalanceUsd] = useState<number | null>(null);
  const [history, setHistory] = useState<WalletTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [amount, setAmount] = useState<string>(String(DEFAULT_AMOUNT));
  const [starting, setStarting] = useState(false);
  const [histFilter, setHistFilter] = useState<HistFilter>("all");

  const filteredHistory = useMemo(
    () => history.filter((tx) => inPeriod(tx.created_at, histFilter)),
    [history, histFilter]
  );

  const totals = useMemo(() => {
    let added = 0;
    let spent = 0;
    for (const tx of filteredHistory) {
      const amt = Number(tx.amount_usd);
      if (tx.direction === "credit") added += amt;
      else spent += amt;
    }
    return { added: Math.round(added * 100) / 100, spent: Math.round(spent * 100) / 100 };
  }, [filteredHistory]);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (opts?.silent) setSyncing(true);
    try {
      const res = await fetch("/api/wallet", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load wallet");
      setBalanceUsd(data.balanceUsd ?? 0);
      setHistory(data.history || []);
      setLastSynced(new Date());
      if (opts?.silent) toast.success("Wallet synced");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not load wallet");
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const symbol = CURRENCY_SYMBOLS[currency];
  const numericAmount = parseFloat(amount || "0");

  const startTopUp = async () => {
    if (!Number.isFinite(numericAmount) || numericAmount < 1) {
      toast.error("Enter an amount of at least " + symbol + "1");
      return;
    }
    setStarting(true);
    try {
      const res = await fetch("/api/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numericAmount, display_currency: currency }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Could not start top-up");
      window.location.href = data.url;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not start top-up");
      setStarting(false);
    }
  };

  // Feature disabled in Manage Website → treat the page as non-existent.
  if (!settings.features.topup) notFound();

  return (
    <>
      <DashboardTopbar title="Wallet" />
      <main className="flex-1 px-4 lg:px-16 xl:px-24 py-6 lg:py-8 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left: balance + add funds + perks */}
          <div className="lg:col-span-2 space-y-6">
            {/* Balance */}
            <div className="bg-gradient-to-r from-[#FF561E] to-[#FF7A45] rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 text-white">
              <div className="flex items-start justify-between gap-4">
                {/* Left: icon + balance */}
                <div className="flex items-center gap-4 min-w-0">
                  <Wallet className="w-9 h-9 text-white shrink-0" strokeWidth={2} />
                  <div className="min-w-0">
                    <p className="text-white/80 text-[13px] font-medium">Wallet Balance</p>
                    {balanceUsd === null ? (
                      <div className="skeleton h-9 w-32 rounded-lg mt-1.5 !bg-white/20" />
                    ) : (
                      <p className="text-[32px] font-bold leading-tight">{format(balanceUsd)}</p>
                    )}
                  </div>
                </div>

                {/* Right: last synced + sync button */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="text-right">
                    <p className="text-white/70 text-[11px] font-medium">Last synced at</p>
                    <p className="text-white/95 text-[12px] font-semibold">
                      {lastSynced ? formatSyncTime(lastSynced) : "—"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => load({ silent: true })}
                    disabled={syncing || loading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[12px] font-semibold transition-colors disabled:opacity-60"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} strokeWidth={2.2} />
                    {syncing ? "Syncing..." : "Sync"}
                  </button>
                </div>
              </div>
            </div>

            {/* Add funds */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
              <p className="text-[15px] font-bold text-[#1A1D20] mb-3">Add funds</p>

              <div className="grid grid-cols-4 gap-2.5 mb-4">
                {PRESETS.map((p) => {
                const active = amount === String(p);
                const isDefault = p === DEFAULT_AMOUNT;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setAmount(String(p))}
                    className={`flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl border text-[14px] font-bold transition-all ${
                      active
                        ? "border-[#FF561E] bg-[#FFF4F0] text-[#FF561E]"
                        : "border-gray-200 text-[#1A1D20] hover:border-orange-200"
                    }`}
                  >
                    <span>
                      {symbol}
                      {p}
                    </span>
                    {isDefault && (
                      <span className={`text-[9px] font-semibold uppercase tracking-wide ${active ? "text-[#FF561E]/70" : "text-[#9CA3AF]"}`}>
                        Default
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <label className="block text-[13px] font-semibold text-[#6B7280] mb-2">Or enter an amount</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-semibold text-[#6B7280]">
                  {symbol}
                </span>
                <input
                  type="number"
                  min={1}
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 rounded-xl bg-white border border-gray-200 outline-none focus:border-[#FF561E] focus:ring-2 focus:ring-[#FF561E]/10 text-[15px] font-semibold text-[#1A1D20] transition-all"
                  placeholder="0"
                />
              </div>
              <button
                onClick={startTopUp}
                disabled={starting}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#FF561E] text-white text-[14px] font-bold hover:bg-[#E04B18] transition-colors shadow-sm shadow-orange-500/20 disabled:opacity-70 shrink-0"
              >
                {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {starting ? "Starting..." : "Add money"}
              </button>
            </div>
              <p className="text-[12px] text-[#6B7280] mt-3">
                Charged in {currency} through our secure payment gateway. Balance can be used at checkout to buy any eSIM.
              </p>
            </div>

            {/* Perks */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Zap, title: "Faster checkout", desc: "Pay once, reuse balance" },
            { icon: ShieldCheck, title: "Secure", desc: "Protected transactions" },
            { icon: Wallet, title: "No expiry", desc: "Credit stays in your wallet" },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="w-10 h-10 rounded-xl bg-[#FFF4F0] flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-[#FF561E]" strokeWidth={2} />
                </div>
                <p className="text-[14px] font-bold text-[#1A1D20]">{f.title}</p>
                <p className="text-[12px] text-[#6B7280] mt-0.5">{f.desc}</p>
              </div>
            );
          })}
            </div>
          </div>

          {/* Right: history */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 lg:sticky lg:top-24">
              <p className="text-[15px] font-bold text-[#1A1D20] mb-4">Wallet history</p>

              {loading ? (
                <div className="divide-y divide-gray-50">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
                      <div className="skeleton w-9 h-9 rounded-xl shrink-0" />
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="skeleton h-3.5 w-40 max-w-[70%] rounded" />
                        <div className="skeleton h-3 w-24 rounded" />
                      </div>
                      <div className="skeleton h-4 w-14 rounded shrink-0" />
                    </div>
                  ))}
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF4F0] flex items-center justify-center mx-auto mb-3">
                    <Wallet className="w-6 h-6 text-[#FF561E]" />
                  </div>
                  <p className="text-[14px] font-semibold text-[#1A1D20]">No transactions yet</p>
                  <p className="text-[12.5px] text-[#6B7280] mt-1">Add money to get started.</p>
                </div>
              ) : (
                <>
                  {/* Period filters */}
                  <div className="flex flex-nowrap items-center gap-1 mb-3 overflow-x-auto -mx-1 px-1">
                    {HIST_FILTERS.map((f) => {
                      const active = histFilter === f.key;
                      return (
                        <button
                          key={f.key}
                          type="button"
                          onClick={() => setHistFilter(f.key)}
                          className={`shrink-0 whitespace-nowrap px-2 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                            active
                              ? "bg-[#FFF4F0] text-[#FF561E] border-[#FF561E]"
                              : "bg-white text-[#6B7280] border-gray-200 hover:text-[#FF561E] hover:border-orange-200"
                          }`}
                        >
                          {f.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Period totals */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-2.5">
                      <p className="text-[11px] text-[#6B7280] font-medium">Added</p>
                      <p className="text-[16px] font-bold text-emerald-600 leading-tight mt-0.5">+{format(totals.added)}</p>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-2.5">
                      <p className="text-[11px] text-[#6B7280] font-medium">Spent</p>
                      <p className="text-[16px] font-bold text-[#1A1D20] leading-tight mt-0.5">−{format(totals.spent)}</p>
                    </div>
                  </div>

                  {filteredHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-[13px] text-[#6B7280] font-medium">No activity in this period.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {filteredHistory.map((tx) => {
                        const meta = REASON_META[tx.reason] || REASON_META.topup;
                        const Icon = meta.icon;
                        const isCredit = tx.direction === "credit";
                        const displayValue =
                          tx.display_currency && tx.display_amount
                            ? `${CURRENCY_SYMBOLS[tx.display_currency as keyof typeof CURRENCY_SYMBOLS] ?? ""}${Number(
                                tx.display_amount
                              ).toFixed(2)}`
                            : format(Number(tx.amount_usd));
                        return (
                          <div key={tx.id} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                isCredit ? "bg-emerald-50" : "bg-gray-100"
                              }`}
                            >
                              <Icon className={`w-4 h-4 ${isCredit ? "text-emerald-600" : "text-[#6B7280]"}`} strokeWidth={2} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[13.5px] font-semibold text-[#1A1D20] truncate">
                                {tx.description || meta.label}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {isCredit ? (
                                  <ArrowDownLeft className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <ArrowUpRight className="w-3 h-3 text-[#9CA3AF]" />
                                )}
                                <span className="text-[11.5px] text-[#6B7280]">
                                  {meta.label} · {formatDate(tx.created_at)}
                                </span>
                              </div>
                            </div>
                            <span className={`text-[14px] font-bold shrink-0 ${isCredit ? "text-emerald-600" : "text-[#1A1D20]"}`}>
                              {isCredit ? "+" : "−"}
                              {displayValue}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
