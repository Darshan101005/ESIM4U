"use client";

import DashboardTopbar from "@/components/dashboard/topbar";
import { useState } from "react";
import { Mail, MessageCircle, BookOpen, ChevronDown, Smartphone } from "lucide-react";

const STEPS = [
  "Open your order from My eSIMs and tap to view the QR code.",
  "On your phone, go to Settings, then Cellular / Mobile Data.",
  "Tap Add eSIM or Add Data Plan, then scan the QR code.",
  "Follow the prompts to install. Label it (e.g. Travel).",
  "On arrival in your destination, turn on the eSIM and enable Data Roaming for it.",
];

const FAQS = [
  { q: "When does my plan start?", a: "Install the eSIM any time. The plan stays Pending and only activates — and the validity countdown begins — when your phone first connects to a supported network in your destination country." },
  { q: "How do I check my remaining data?", a: "Open the eSIM from My eSIMs. Live data usage and remaining balance are shown there once the plan is active." },
  { q: "Will the eSIM work on my phone?", a: "Most phones from 2018 onward support eSIM (iPhone XS and newer, recent Samsung/Pixel). Your phone must be carrier-unlocked." },
  { q: "Can I top up or extend a plan?", a: "Many plans support top-ups. Where available, you'll see the option on your eSIM details. Otherwise simply buy a new plan." },
];

export default function SupportPage() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <>
      <DashboardTopbar title="Support" />
      <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8 max-w-3xl space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a href="mailto:support@esim4u.com" className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 hover:border-orange-100 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#FFF4F0] flex items-center justify-center mb-3">
              <Mail className="w-5 h-5 text-[#FF561E]" strokeWidth={2} />
            </div>
            <p className="text-[14px] font-bold text-[#1A1D20]">Email us</p>
            <p className="text-[12px] text-[#6B7280] mt-0.5">support@esim4u.com</p>
          </a>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5">
            <div className="w-10 h-10 rounded-xl bg-[#FFF4F0] flex items-center justify-center mb-3">
              <MessageCircle className="w-5 h-5 text-[#FF561E]" strokeWidth={2} />
            </div>
            <p className="text-[14px] font-bold text-[#1A1D20]">24/7 Support</p>
            <p className="text-[12px] text-[#6B7280] mt-0.5">We typically reply within a few hours.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-[#FF561E]" />
            <h3 className="text-[16px] font-bold text-[#1A1D20]">Installation Guide</h3>
          </div>
          <ol className="space-y-3">
            {STEPS.map((s, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#FFF4F0] text-[#FF561E] text-[12px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                <span className="text-[13px] text-[#374151] leading-relaxed">{s}</span>
              </li>
            ))}
          </ol>
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#FFF4F0] border border-orange-100 px-4 py-3">
            <Smartphone className="w-4 h-4 text-[#FF561E] shrink-0" />
            <p className="text-[12px] text-[#6B7280]">Tip: install on home Wi-Fi before you travel; activation happens automatically on arrival.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
          <h3 className="text-[16px] font-bold text-[#1A1D20] mb-4">Frequently asked</h3>
          <div className="divide-y divide-gray-50">
            {FAQS.map((f, i) => (
              <div key={i} className="py-1">
                <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between py-3 text-left">
                  <span className="text-[14px] font-semibold text-[#1A1D20] pr-4">{f.q}</span>
                  <ChevronDown className={`w-4 h-4 text-[#6B7280] shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`} />
                </button>
                {open === i && <p className="text-[13px] text-[#6B7280] leading-relaxed pb-3">{f.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
