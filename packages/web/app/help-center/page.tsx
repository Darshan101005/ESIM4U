import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/marketing/site-header";
import SiteFooter from "@/components/marketing/site-footer";
import { BookOpen, HelpCircle, MessageCircle, Mail, Smartphone, ArrowRight } from "lucide-react";
import { getSiteSettings } from "@/lib/site-settings";
import { toWaLink } from "@/lib/site-settings-types";

export const metadata: Metadata = {
  title: "Help Center | eSIM4U",
  description: "Find answers, installation guides, and ways to reach the eSIM4U support team.",
};

const cards = [
  { icon: HelpCircle, title: "FAQs", desc: "Answers to the most common questions about plans, activation, and billing.", href: "/faq" },
  { icon: Smartphone, title: "Installation guides", desc: "Step-by-step eSIM setup for iOS and Android devices.", href: "/installation" },
  { icon: BookOpen, title: "Blog & tips", desc: "Guides on roaming, saving data, and staying connected abroad.", href: "/blog" },
  { icon: Mail, title: "Contact us", desc: "Send us a message and we'll reply to your inbox.", href: "/contact" },
];

export default async function HelpCenterPage() {
  const settings = await getSiteSettings();
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      <main className="flex-1 w-full">
        <div className="w-full bg-gradient-to-b from-[#FFF4F0] to-white">
          <SiteHeader />
          <div className="max-w-[1000px] mx-auto px-5 sm:px-8 pt-6 pb-8 sm:pt-10 text-center">
            <h1 className="text-[30px] sm:text-[44px] leading-[1.1] font-semibold text-[#1A1D20] tracking-[-0.02em]">
              How can we <span className="text-[#FF561E] font-serif italic font-normal">help?</span>
            </h1>
            <p className="mt-4 text-[16px] leading-[1.7] text-[#5E6673] font-medium max-w-[560px] mx-auto">
              Browse our guides and FAQs, or get in touch with our support team.
            </p>
          </div>
        </div>

        <div className="max-w-[1000px] mx-auto px-5 sm:px-8 py-10 sm:py-14 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {cards.map((c) => (
            <Link key={c.title} href={c.href} className="group flex items-start gap-4 rounded-2xl border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 hover:border-orange-200 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF4F0] flex items-center justify-center shrink-0">
                <c.icon className="w-6 h-6 text-[#FF561E]" />
              </div>
              <div>
                <h2 className="text-[16px] font-bold text-[#1A1D20] group-hover:text-[#FF561E] transition-colors">{c.title}</h2>
                <p className="text-[13px] text-[#6B7280] mt-1 leading-relaxed">{c.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#FF561E] ml-auto shrink-0 mt-1" />
            </Link>
          ))}
        </div>

        <div className="max-w-[1000px] mx-auto px-5 sm:px-8 pb-14">
          <div className="rounded-2xl bg-[#1A1D20] px-6 py-8 sm:px-10 flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left">
            <div>
              <p className="text-[18px] font-bold text-white flex items-center gap-2 justify-center sm:justify-start">
                <MessageCircle className="w-5 h-5 text-emerald-400" /> Still need help?
              </p>
              <p className="text-[14px] text-white/70 mt-1">Chat with us on WhatsApp for a quick reply.</p>
            </div>
            <a href={settings.whatsapp ? toWaLink(settings.whatsapp) : `mailto:${settings.contactEmail}`} target="_blank" rel="noopener noreferrer" className="px-7 py-3 rounded-full bg-emerald-500 text-white font-semibold text-[14px] hover:bg-emerald-600 transition-colors shrink-0">
              {settings.whatsapp ? "Message on WhatsApp" : "Email us"}
            </a>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
