"use client";

import DashboardTopbar from "@/components/dashboard/topbar";
import Link from "next/link";
import { Wallet, Zap, ShieldCheck, Clock } from "lucide-react";
import { useCurrency } from "@/lib/currency-context";

export default function TopUpPage() {
  const { format } = useCurrency();

  return (
    <>
      <DashboardTopbar title="Top Up" />
      <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8 max-w-3xl">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-[#FF561E] to-[#FF7A45] p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-[13px] font-medium">Wallet Balance</p>
                <p className="text-[32px] font-bold leading-tight">{format(0)}</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center">
                <Wallet className="w-7 h-7 text-white" strokeWidth={2} />
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 text-[11px] font-semibold">
                <Clock className="w-3 h-3" /> Coming soon
              </span>
            </div>
            <p className="text-[14px] text-[#6B7280] leading-relaxed">
              Wallet top-up lets you preload credit and check out faster. Card payments are being finalised and will be
              enabled here shortly. In the meantime, you can buy any eSIM plan instantly from Browse.
            </p>
            <Link
              href="/dashboard/browse"
              className="inline-flex mt-5 px-5 py-3 rounded-xl bg-[#FF561E] text-white text-[14px] font-bold hover:bg-[#E04B18] transition-colors shadow-sm shadow-orange-500/20"
            >
              Browse eSIM Plans
            </Link>
          </div>
        </div>

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
      </main>
    </>
  );
}
