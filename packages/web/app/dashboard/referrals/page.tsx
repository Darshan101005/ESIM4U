"use client";

import DashboardTopbar from "@/components/dashboard/topbar";
import { useState } from "react";
import { useCachedSession } from "@/lib/auth-client";
import { Gift, Copy, Check, Users, DollarSign, Share2 } from "lucide-react";
import toast from "react-hot-toast";

export default function ReferralsPage() {
  const { data: session } = useCachedSession();
  const user = session?.user as { id?: string; name?: string } | undefined;
  const [copied, setCopied] = useState(false);

  const code = (user?.id || "").slice(0, 8).toUpperCase() || "ESIM4U";
  const link = typeof window !== "undefined" ? `${window.location.origin}/signup?ref=${code}` : `/signup?ref=${code}`;

  const copy = async () => {
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
          <h2 className="text-[24px] font-bold leading-tight">Refer friends, earn $5.00</h2>
          <p className="text-white/85 text-[14px] mt-2 max-w-md">
            Share your invite link. When a friend signs up and buys their first eSIM, you both get $5.00 in credit.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 mb-6">
          <label className="block text-[13px] font-semibold text-[#6B7280] mb-2">Your invite link</label>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={link}
              className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-[13px] text-[#1A1D20] outline-none truncate"
            />
            <button
              onClick={copy}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#FF561E] text-white text-[13px] font-bold hover:bg-[#E04B18] transition-colors shrink-0"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <div className="flex items-center gap-2 mt-3 text-[12px] text-[#6B7280]">
            <Share2 className="w-3.5 h-3.5" /> Share on WhatsApp, Instagram, or anywhere you like.
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="w-10 h-10 rounded-xl bg-[#FFF4F0] flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-[#FF561E]" strokeWidth={2} />
            </div>
            <p className="text-[24px] font-bold text-[#1A1D20]">0</p>
            <p className="text-[12px] text-[#6B7280]">Friends referred</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="w-10 h-10 rounded-xl bg-[#FFF4F0] flex items-center justify-center mb-3">
              <DollarSign className="w-5 h-5 text-[#FF561E]" strokeWidth={2} />
            </div>
            <p className="text-[24px] font-bold text-[#1A1D20]">$0.00</p>
            <p className="text-[12px] text-[#6B7280]">Credit earned</p>
          </div>
        </div>
      </main>
    </>
  );
}
