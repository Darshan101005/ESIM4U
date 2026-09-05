import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/marketing/site-header";
import SiteFooter from "@/components/marketing/site-footer";
import { Info } from "lucide-react";

export const metadata: Metadata = {
  title: "eSIM Installation Guide | eSIM4U",
  description: "How to install and activate your eSIM4U plan on iPhone (iOS) and Android devices.",
};

const h2 = "text-[20px] sm:text-[22px] font-bold text-[#1A1D20] tracking-tight mb-4";
const stepCls = "flex items-start gap-3";
const numCls = "w-7 h-7 rounded-full bg-[#FF561E] text-white text-[13px] font-bold flex items-center justify-center shrink-0";

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className={stepCls}>
      <span className={numCls}>{n}</span>
      <div>
        <p className="text-[15px] font-bold text-[#1A1D20]">{title}</p>
        <p className="text-[14px] text-[#6B7280] leading-relaxed mt-0.5">{children}</p>
      </div>
    </div>
  );
}

export default function InstallationPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      <main className="flex-1 w-full">
        <div className="w-full bg-gradient-to-b from-[#FFF4F0] to-white">
          <SiteHeader />
          <div className="max-w-[820px] mx-auto px-5 sm:px-8 pt-6 pb-8 sm:pt-10 text-center">
            <h1 className="text-[30px] sm:text-[44px] leading-[1.1] font-semibold text-[#1A1D20] tracking-[-0.02em]">
              eSIM Installation <span className="text-[#FF561E] font-serif italic font-normal">Guide</span>
            </h1>
            <p className="mt-4 text-[16px] leading-[1.7] text-[#5E6673] font-medium max-w-[560px] mx-auto">
              Setting up your eSIM takes a couple of minutes. Install on Wi-Fi before you travel — your plan only
              activates when you connect at your destination.
            </p>
          </div>
        </div>

        <div className="max-w-[820px] mx-auto px-5 sm:px-8 py-10 sm:py-14 space-y-8">
          <section className="rounded-2xl border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 sm:p-8">
            <h2 className={h2}>On iPhone (iOS)</h2>
            <div className="space-y-5">
              <Step n={1} title="Open Settings">Go to Settings &gt; Cellular / Mobile Data &gt; Add eSIM.</Step>
              <Step n={2} title="Scan your QR code">Choose &quot;Use QR Code&quot; and scan the code from your confirmation email, or enter the SM-DP+ address and activation code manually.</Step>
              <Step n={3} title="Label the plan">Give it a name like &quot;Travel&quot; so it&apos;s easy to identify.</Step>
              <Step n={4} title="Turn on Data Roaming">On arrival, set the eSIM as your data line and enable Data Roaming for it.</Step>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 sm:p-8">
            <h2 className={h2}>On Android</h2>
            <div className="space-y-5">
              <Step n={1} title="Open Settings">Go to Settings &gt; Network &amp; Internet (or SIM manager).</Step>
              <Step n={2} title="Add a SIM">Tap the + next to SIMs and choose &quot;Download a SIM instead&quot;.</Step>
              <Step n={3} title="Scan your QR code">Scan the code from your confirmation email and confirm to install.</Step>
              <Step n={4} title="Enable the eSIM">Set it as your mobile data line and turn on Data Roaming when you arrive.</Step>
            </div>
          </section>

          <div className="flex items-start gap-3 rounded-2xl bg-[#FFF4F0] border border-orange-100 px-5 py-4">
            <Info className="w-5 h-5 text-[#FF561E] shrink-0 mt-0.5" strokeWidth={2} />
            <p className="text-[13px] text-[#6B7280] leading-relaxed">
              After purchase, signed-in customers get detailed step-by-step guides with screenshots for{" "}
              <Link href="/dashboard/support/ios" className="text-[#FF561E] font-semibold underline underline-offset-2">iOS</Link>{" "}
              and{" "}
              <Link href="/dashboard/support/android" className="text-[#FF561E] font-semibold underline underline-offset-2">Android</Link>{" "}
              in the support area.
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
