"use client";

import DashboardTopbar from "@/components/dashboard/topbar";
import { useEffect, useState } from "react";
import { useCurrency } from "@/lib/currency-context";
import { Gift, Copy, Check, Users, Wallet, Share2, ArrowDownLeft, ArrowUpRight, Info } from "lucide-react";
import toast from "react-hot-toast";

interface LedgerEntry {
  direction: "credit" | "debit";
  amount_usd: string;
  reason: string;
  description: string | null;
  created_at: string;
}

interface ReferralSummary {
  code: string;
  link: string;
  friendsReferred: number;
  qualifiedCount: number;
  balanceUsd: number;
  earnedUsd: number;
  spentUsd: number;
  history: LedgerEntry[];
}

const REWARD_USD = 3;
const MIN_PURCHASE_USD = 25;

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

export default function ReferralsPage() {
  const { format } = useCurrency();
  const [copied, setCopied] = useState(false);
  const [summary, setSummary] = useState<ReferralSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/referrals")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: ReferralSummary) => {
        if (active) setSummary(data);
      })
      .catch(() => {
        if (active) toast.error("Could not load your referrals");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const link = summary?.link || "";

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Invite link copied");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <>
      <DashboardTopbar title="Referrals" />
      <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8 max-w-3xl mx-auto w-full">
        <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#FF561E] to-[#FF7A45] p-6 lg:p-8 text-white mb-6">
          <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center mb-4">
            <Gift className="w-6 h-6 text-white" strokeWidth={2} />
          </div>
          <h2 className="text-[24px] font-bold leading-tight">Refer friends, you both earn ${REWARD_USD.toFixed(2)}</h2>
          <p className="text-white/85 text-[14px] mt-2 max-w-md">
            Share your invite link. When a friend signs up and makes their first eligible purchase of ${MIN_PURCHASE_USD}+,
            you both get ${REWARD_USD.toFixed(2)} in referral credit.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 mb-6">
          <label className="block text-[13px] font-semibold text-[#6B7280] mb-2">Your invite link</label>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={loading ? "Loading…" : link}
              className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-[13px] text-[#1A1D20] outline-none truncate"
            />
            <button
              onClick={copy}
              disabled={!link}
              title={copied ? "Copied" : "Copy"}
              className="inline-flex items-center justify-center gap-2 px-3.5 sm:px-5 py-3 rounded-xl bg-[#FF561E] text-white text-[13px] font-bold hover:bg-[#E04B18] transition-colors shrink-0 disabled:opacity-50"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
          <div className="flex items-center gap-2 mt-3 text-[12px] text-[#6B7280]">
            <Share2 className="w-3.5 h-3.5" /> Share on WhatsApp, Instagram, or anywhere you like.
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="w-10 h-10 rounded-xl bg-[#FFF4F0] flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-[#FF561E]" strokeWidth={2} />
            </div>
            <p className="text-[24px] font-bold text-[#1A1D20]">{summary?.friendsReferred ?? 0}</p>
            <p className="text-[12px] text-[#6B7280]">Friends referred</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="w-10 h-10 rounded-xl bg-[#FFF4F0] flex items-center justify-center mb-3">
              <Gift className="w-5 h-5 text-[#FF561E]" strokeWidth={2} />
            </div>
            <p className="text-[24px] font-bold text-[#1A1D20]">{format(summary?.earnedUsd ?? 0)}</p>
            <p className="text-[12px] text-[#6B7280]">Credit earned</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="w-10 h-10 rounded-xl bg-[#FFF4F0] flex items-center justify-center mb-3">
              <Wallet className="w-5 h-5 text-[#FF561E]" strokeWidth={2} />
            </div>
            <p className="text-[24px] font-bold text-[#1A1D20]">{format(summary?.balanceUsd ?? 0)}</p>
            <p className="text-[12px] text-[#6B7280]">Available balance</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-[15px] font-bold text-[#1A1D20]">Credit history</h3>
            <p className="text-[12px] text-[#6B7280] mt-0.5">Everything you&apos;ve earned and spent.</p>
          </div>
          {loading ? (
            <div className="px-6 py-10 text-center text-[13px] text-[#6B7280]">Loading…</div>
          ) : !summary || summary.history.length === 0 ? (
            <div className="px-6 py-10 text-center text-[13px] text-[#6B7280]">
              No referral activity yet. Share your link to start earning.
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {summary.history.map((h, i) => {
                const isCredit = h.direction === "credit";
                return (
                  <li key={i} className="px-6 py-4 flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isCredit ? "bg-[#EAF7EE]" : "bg-[#FFF4F0]"
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="w-4 h-4 text-[#12A150]" strokeWidth={2.2} />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 text-[#FF561E]" strokeWidth={2.2} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[#1A1D20] truncate">
                        {h.description || (isCredit ? "Referral credit" : "Referral credit used")}
                      </p>
                      <p className="text-[12px] text-[#6B7280]">{formatDate(h.created_at)}</p>
                    </div>
                    <p className={`text-[14px] font-bold shrink-0 ${isCredit ? "text-[#12A150]" : "text-[#1A1D20]"}`}>
                      {isCredit ? "+" : "−"}
                      {format(Number(h.amount_usd))}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-2xl bg-[#FFF9F6] border border-[#FFE2D6] p-5">
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-[#FF561E] mt-0.5 shrink-0" strokeWidth={2} />
            <div className="text-[12px] text-[#6B7280] leading-relaxed">
              <p className="font-semibold text-[#1A1D20] mb-1">How referral credit works</p>
              <p>
                Both you and your friend earn ${REWARD_USD.toFixed(2)} once they complete their first purchase of $
                {MIN_PURCHASE_USD} or more. Referral credit can be redeemed on orders of ${MIN_PURCHASE_USD}+, with the
                redeemable share growing as your order value increases.
              </p>
              <p className="mt-3">* Terms and conditions apply.</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
