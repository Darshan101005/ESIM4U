import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/marketing/site-header";
import SiteFooter from "@/components/marketing/site-footer";
import { Megaphone, DollarSign, LineChart, Tag, ArrowRight } from "lucide-react";
import { getSiteSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Affiliate Program | eSIM4U",
  description:
    "Partner with eSIM4U and earn commission by promoting affordable global eSIM data plans to your audience.",
};

const perks = [
  { icon: DollarSign, title: "Earn commission", desc: "Get paid a commission on every sale made with your unique affiliate code." },
  { icon: Tag, title: "Give a discount", desc: "Your code also gives your audience a discount, so it's easy to share." },
  { icon: LineChart, title: "Track your results", desc: "Get a private dashboard link to follow your sales, commission, and payouts — no login needed." },
];

const steps = [
  { n: "1", title: "Apply", desc: "Send us your details and tell us about your audience." },
  { n: "2", title: "Get approved", desc: "Our team reviews and sets you up with a unique affiliate code." },
  { n: "3", title: "Share your code", desc: "Promote it to your audience — they get a discount when they use it." },
  { n: "4", title: "Earn & get paid", desc: "Earn commission on every sale; we pay you out and you track it all on your dashboard." },
];

export default async function AffiliatePage() {
  const settings = await getSiteSettings();
  if (!settings.features.affiliate) notFound();

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      <main className="flex-1 w-full">
        <div className="w-full bg-gradient-to-b from-[#FFF4F0] to-white">
          <SiteHeader />
          <div className="max-w-[900px] mx-auto px-5 sm:px-8 pt-6 pb-8 sm:pt-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-orange-100 shadow-sm mb-5">
              <Megaphone className="w-4 h-4 text-[#FF561E]" />
              <span className="text-[#FF561E] text-[12px] font-semibold tracking-wide">Affiliate Program</span>
            </div>
            <h1 className="text-[30px] sm:text-[46px] leading-[1.08] font-semibold text-[#1A1D20] tracking-[-0.02em]">
              Partner with <span className="text-[#FF561E] font-serif italic font-normal">eSIM4U</span>
            </h1>
            <p className="mt-4 text-[15px] sm:text-[16px] leading-[1.7] text-[#5E6673] font-medium max-w-[560px] mx-auto">
              Are you a travel creator, blogger, or community builder? Promote eSIM4U to your audience with your own
              code and earn commission on every sale.
            </p>
          </div>
        </div>

        <div className="max-w-[1000px] mx-auto px-5 sm:px-8 py-10 sm:py-14">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12">
            {perks.map((p) => (
              <div key={p.title} className="rounded-2xl border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
                <div className="w-12 h-12 rounded-2xl bg-[#FFF4F0] flex items-center justify-center mb-4">
                  <p.icon className="w-6 h-6 text-[#FF561E]" />
                </div>
                <h3 className="text-[16px] font-bold text-[#1A1D20] mb-1.5">{p.title}</h3>
                <p className="text-[13px] text-[#6B7280] leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>

          <h2 className="text-[24px] font-semibold text-[#1A1D20] text-center mb-8 tracking-tight">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
            {steps.map((s) => (
              <div key={s.n} className="rounded-2xl border border-gray-100 bg-white p-6 text-center">
                <div className="w-11 h-11 rounded-full bg-[#FF561E] text-white font-bold text-[17px] flex items-center justify-center mx-auto mb-4">{s.n}</div>
                <h3 className="text-[15px] font-bold text-[#1A1D20] mb-1.5">{s.title}</h3>
                <p className="text-[13px] text-[#6B7280] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-[#FFF4F0] border border-orange-100 px-6 py-8 text-center">
            <p className="text-[18px] font-bold text-[#1A1D20] mb-1">Ready to partner with us?</p>
            <p className="text-[14px] text-[#6B7280] mb-5 max-w-[460px] mx-auto">
              Send us your details and audience info. Once approved, we&apos;ll set you up with your affiliate code and a
              private dashboard link to track your earnings.
            </p>
            <Link href="/contact?subject=Affiliate%20Program%20Application" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#FF561E] text-white font-semibold text-[15px] shadow-lg shadow-orange-500/20">
              Apply to become an affiliate <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <p className="text-[12px] text-[#9CA3AF] text-center mt-6">
            Already an affiliate? Use the private dashboard link we emailed you to view your sales and payouts — no
            login required.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
