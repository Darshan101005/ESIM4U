import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAffiliateByToken } from "@/lib/affiliate";
import { CheckCircle2, Clock, DollarSign, TrendingUp, Wallet, Tag } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Affiliate Dashboard | eSIM4U",
  robots: { index: false, follow: false },
};

const money = (v: number | string) => `$${Number(v).toFixed(2)}`;
const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "—");

export default async function PartnerPage({ params }: { params: { token: string } }) {
  const data = await getAffiliateByToken(params.token);
  if (!data) notFound();

  const { name, code, commissionRate, isActive, stats, payouts, recentSales } = data;

  const cards = [
    { icon: TrendingUp, label: "Sales", value: String(stats.salesCount) },
    { icon: DollarSign, label: "Commission earned", value: money(stats.totalCommission) },
    { icon: CheckCircle2, label: "Paid out", value: money(stats.totalPaid) },
    { icon: Wallet, label: "Balance owed", value: money(stats.balanceOwed) },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] font-sans">
      <header className="w-full bg-white border-b border-gray-100">
        <div className="max-w-[1000px] mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Image src="/assets/esim4u-logo.png" alt="eSIM4U" width={110} height={34} className="object-contain w-[104px]" />
          <span className="text-[12px] font-semibold text-[#6B7280]">Affiliate Dashboard</span>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1000px] mx-auto px-5 sm:px-8 py-8 sm:py-10">
        <div className="mb-8">
          <p className="text-[13px] text-[#6B7280]">Welcome back,</p>
          <h1 className="text-[26px] sm:text-[32px] font-semibold text-[#1A1D20] tracking-tight">{name}</h1>
          {!isActive && (
            <span className="inline-flex items-center mt-2 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-500">
              Inactive — contact us to reactivate
            </span>
          )}
        </div>

        {/* Code + how to share */}
        <div className="rounded-2xl border border-orange-100 bg-[#FFF4F0] p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-5 h-5 text-[#FF561E]" />
            <h2 className="text-[16px] font-bold text-[#1A1D20]">Your affiliate code</h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-block text-[22px] font-bold tracking-[0.15em] text-[#FF561E] bg-white border border-orange-100 rounded-xl px-5 py-2.5">
              {code}
            </span>
            <span className="text-[13px] text-[#6B7280]">Commission: <span className="font-bold text-[#1A1D20]">{commissionRate}%</span> per sale</span>
          </div>
          <p className="text-[13px] text-[#6B7280] mt-3 leading-relaxed">
            Share this code with your audience. When someone enters it at checkout on{" "}
            <Link href="/" className="text-[#FF561E] font-semibold underline underline-offset-2">esim4u.uk</Link>, they get a
            discount and you earn commission on the sale.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {cards.map((c, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5">
              <div className="w-10 h-10 rounded-xl bg-[#FFF4F0] flex items-center justify-center mb-3">
                <c.icon className="w-5 h-5 text-[#FF561E]" />
              </div>
              <p className="text-[22px] font-bold text-[#1A1D20] leading-none">{c.value}</p>
              <p className="text-[12.5px] text-[#6B7280] mt-1.5">{c.label}</p>
            </div>
          ))}
        </div>

        {/* Payout history */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 mb-6">
          <h2 className="text-[16px] font-bold text-[#1A1D20] mb-4">Payout history</h2>
          {payouts.length === 0 ? (
            <p className="text-[13px] text-[#6B7280]">No payouts yet. Your balance owed is {money(stats.balanceOwed)}.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {payouts.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-[14px] font-bold text-[#1A1D20]">{money(p.amount)}</p>
                    <p className="text-[12px] text-[#9CA3AF]">
                      {p.status === "completed" ? `Paid ${fmtDate(p.paid_at)}` : `Requested ${fmtDate(p.created_at)}`}
                      {p.method ? ` · ${p.method}` : ""}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${p.status === "completed" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                    {p.status === "completed" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                    {p.status === "completed" ? "Completed" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent sales */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
          <h2 className="text-[16px] font-bold text-[#1A1D20] mb-4">Recent sales</h2>
          {recentSales.length === 0 ? (
            <p className="text-[13px] text-[#6B7280]">No sales recorded yet.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentSales.map((s: { order_reference: string; sale_amount: string; commission_amount: string; created_at: string }, i: number) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-[13px] font-semibold text-[#1A1D20]">Order {s.order_reference}</p>
                    <p className="text-[12px] text-[#9CA3AF]">{fmtDate(s.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-bold text-[#FF561E]">+{money(s.commission_amount)}</p>
                    <p className="text-[11px] text-[#9CA3AF]">on {money(s.sale_amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-[12px] text-[#9CA3AF] text-center mt-8">
          This is your private, read-only dashboard. Questions? Email{" "}
          <a href="mailto:support@esim4u.uk" className="text-[#FF561E] font-semibold">support@esim4u.uk</a>.
        </p>
      </main>
    </div>
  );
}
