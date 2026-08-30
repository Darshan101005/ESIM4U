"use client";

import Image from "next/image";
import Link from "next/link";
import DashboardTopbar from "@/components/dashboard/topbar";
import { useEffect, useState } from "react";
import { Mail, BookOpen, ChevronDown, ChevronRight, Smartphone, Ticket, Headset } from "lucide-react";

const FAQS = [
  { q: "When does my plan start?", a: "Install the eSIM any time. The plan stays Pending and only activates — and the validity countdown begins — when your phone first connects to a supported network in your destination country." },
  { q: "How do I check my remaining data?", a: "Open the eSIM from My eSIMs. Live data usage and remaining balance are shown there once the plan is active." },
  { q: "Will the eSIM work on my phone?", a: "Most phones from 2018 onward support eSIM (iPhone XS and newer, recent Samsung/Pixel). Your phone must be carrier-unlocked." },
  { q: "Can I top up or extend a plan?", a: "Many plans support recharges. Where available, you'll see the Recharge option on your eSIM in My eSIMs. Otherwise simply buy a new plan." },
];

const WHATSAPP_DISPLAY = "+92 323 9539487";
const WHATSAPP_LINK = "https://wa.me/923239539487";

export default function SupportPage() {
  const [open, setOpen] = useState<number | null>(0);
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/support/presence", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setOnline(Boolean(d?.online)))
      .catch(() => setOnline(false));
  }, []);

  return (
    <>
      <DashboardTopbar title="Support" />
      <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8 max-w-3xl mx-auto w-full space-y-6">
        {/* Live chat + tickets — kept above the FAQs so help is one tap away */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/dashboard/support/chat"
            className="group relative rounded-2xl bg-white border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 hover:border-orange-200 transition-colors"
          >
            <div className="w-11 h-11 rounded-2xl bg-[#FFF4F0] flex items-center justify-center mb-3">
              <Headset className="w-6 h-6 text-[#FF561E]" />
            </div>
            <p className="text-[16px] font-bold text-[#1A1D20]">Live Chat</p>
            <p className="text-[12.5px] text-[#6B7280] mt-0.5 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${online ? "bg-emerald-500" : "bg-gray-300"}`} />
              {online === null ? "Checking…" : online ? "We're online now" : "Usually replies within 1 hr"}
            </p>
            <ChevronRight className="w-5 h-5 absolute top-5 right-5 text-gray-300 group-hover:text-[#FF561E] transition-colors" />
          </Link>

          <Link
            href="/dashboard/support/tickets"
            className="group relative rounded-2xl bg-white border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 hover:border-orange-200 transition-colors"
          >
            <div className="w-11 h-11 rounded-2xl bg-[#FFF4F0] flex items-center justify-center mb-3">
              <Ticket className="w-6 h-6 text-[#FF561E]" />
            </div>
            <p className="text-[16px] font-bold text-[#1A1D20]">Support Tickets</p>
            <p className="text-[12.5px] text-[#6B7280] mt-0.5">Track issues that need more than a quick chat.</p>
            <ChevronRight className="w-5 h-5 absolute top-5 right-5 text-gray-300 group-hover:text-[#FF561E] transition-colors" />
          </Link>
        </div>

        {/* Installation guide */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-[#FF561E]" />
            <h3 className="text-[16px] font-bold text-[#1A1D20]">Installation Guide</h3>
          </div>
          <p className="text-[13px] text-[#6B7280] mb-4">Choose your device to view step-by-step eSIM activation instructions.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/dashboard/support/android" className="group flex items-center gap-4 rounded-2xl border border-gray-200 p-4 hover:border-orange-200 hover:bg-[#FFF4F0] transition-all">
              <div className="w-12 h-12 flex items-center justify-center shrink-0">
                <Image src="/assets/Installation/Andriod/Andriod.png" alt="Android" width={40} height={40} className="w-10 h-10 object-contain" />
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-bold text-[#1A1D20]">Android</p>
                <p className="text-[12px] text-[#6B7280]">eSIM Activation on Android</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#FF561E] ml-auto shrink-0" />
            </Link>
            <Link href="/dashboard/support/ios" className="group flex items-center gap-4 rounded-2xl border border-gray-200 p-4 hover:border-orange-200 hover:bg-[#FFF4F0] transition-all">
              <div className="w-12 h-12 flex items-center justify-center shrink-0">
                <Image src="/assets/Installation/Ios/Apple.svg" alt="Apple" width={32} height={32} className="w-8 h-8 object-contain" />
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-bold text-[#1A1D20]">Apple</p>
                <p className="text-[12px] text-[#6B7280]">eSIM Activation on iOS</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#FF561E] ml-auto shrink-0" />
            </Link>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#FFF4F0] border border-orange-100 px-4 py-3">
            <Smartphone className="w-4 h-4 text-[#FF561E] shrink-0" />
            <p className="text-[12px] text-[#6B7280]">Tip: install on home Wi-Fi before you travel; activation happens automatically on arrival.</p>
          </div>
        </div>

        {/* FAQs */}
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

        {/* Contact channels — below the FAQs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a href="mailto:support@esim4u.uk" className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 hover:border-orange-100 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#FFF4F0] flex items-center justify-center mb-3">
              <Mail className="w-5 h-5 text-[#FF561E]" strokeWidth={2} />
            </div>
            <p className="text-[14px] font-bold text-[#1A1D20]">Email us</p>
            <p className="text-[12px] text-[#6B7280] mt-0.5">support@esim4u.uk</p>
          </a>
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 hover:border-emerald-200 transition-colors"
          >
            <Image src="/assets/whatsapp.svg" alt="WhatsApp" width={40} height={40} className="w-10 h-10 rounded-xl mb-3" />
            <p className="text-[14px] font-bold text-[#1A1D20]">WhatsApp</p>
            <p className="text-[12px] text-[#6B7280] mt-0.5">{WHATSAPP_DISPLAY}</p>
          </a>
        </div>
      </main>
    </>
  );
}
