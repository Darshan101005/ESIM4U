import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Headset } from "lucide-react";
import FaqAccordion, { FaqItem } from "@/components/faq-accordion";

export const metadata: Metadata = {
  title: "FAQ | eSIM4U",
  description:
    "Answers to the most common questions about eSIM4U: how eSIMs work, device compatibility, activation, data plans, refunds, and support.",
};

const faqs: FaqItem[] = [
  {
    question: "What is an eSIM and how does it work?",
    answer:
      "An eSIM is a digital SIM built into your device, so there is no physical card to insert. You buy a data plan, scan a QR code or tap install, and your device connects to a local network instantly no store visits or shipping required.",
  },
  {
    question: "Is my device compatible with eSIM4U?",
    answer:
      "Most modern smartphones, tablets, and smartwatches support eSIM, including recent iPhone, Samsung Galaxy, and Google Pixel models. Make sure your device is carrier-unlocked. You can check your settings for an eSIM or Add Mobile Plan option to confirm support.",
  },
  {
    question: "How do I install and activate my eSIM?",
    answer:
      "After purchase you receive a QR code and installation details. Go to your device network settings, choose to add an eSIM or mobile plan, scan the QR code, and follow the prompts. Activation usually takes under a minute once you arrive at your destination.",
  },
  {
    question: "Will I keep my regular phone number?",
    answer:
      "Yes. Your eSIM data plan runs alongside your primary SIM, so you keep your existing number for calls and texts while using affordable eSIM4U data abroad. You can switch your data line in settings at any time.",
  },
  {
    question: "When does my data plan start and how long does it last?",
    answer:
      "Your validity period begins when the eSIM first connects to a network at your destination, not at the time of purchase. Each plan clearly shows its data allowance and validity in days before you check out.",
  },
  {
    question: "Can I top up or buy more data?",
    answer:
      "Yes. If your plan supports top-ups, you can add more data from your dashboard without installing a new eSIM. You can also purchase a new plan at any time for a different destination or a longer stay.",
  },
  {
    question: "Which countries and networks do you cover?",
    answer:
      "We offer eSIM data plans across 200+ countries and territories, connecting to 500+ trusted local and regional networks. You can browse coverage and pricing for any destination directly from your dashboard.",
  },
  {
    question: "What is your refund policy?",
    answer:
      "We stand behind our service with a money-back guarantee. If your eSIM does not activate as promised, contact our support team for a hassle-free refund. Reach out and we will make it right, no complicated process.",
  },
  {
    question: "How do I get help if something goes wrong?",
    answer:
      "Our customer support team is available to help with installation, activation, and connectivity questions. Visit the Help Center or contact us, and we will guide you through any issue as quickly as possible.",
  },
];

export default function FaqPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      <header className="w-full px-8 md:px-12 xl:px-16 pt-8 flex items-center justify-between relative z-50">
        <div className="flex-1 flex justify-start">
          <Link href="/" className="flex items-center">
            <Image
              src="/assets/esim4u-logo.png"
              alt="eSIM4U Logo"
              width={140}
              height={42}
              className="object-contain"
              priority
            />
          </Link>
        </div>

        <div className="hidden lg:flex h-[56px] bg-white/60 backdrop-blur-xl rounded-full shadow-[0_4px_24px_rgb(0,0,0,0.06)] border border-white/60 items-center px-8">
          <nav className="flex items-center gap-8 text-[14px] font-medium text-[#1A1D20]">
            <Link href="/" className="hover:text-[#FF561E] transition-colors">Home</Link>
            <Link href="/#comparison" className="hover:text-[#FF561E] transition-colors">Features</Link>
            <Link href="/#destinations" className="hover:text-[#FF561E] transition-colors">Destinations</Link>
            <Link href="/#how-it-works" className="hover:text-[#FF561E] transition-colors">How It Works</Link>
            <Link href="/about-us" className="hover:text-[#FF561E] transition-colors">About Us</Link>
            <Link href="/faq" className="relative text-[#FF561E]">
              FAQs
              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-[2.5px] bg-[#FF561E] rounded-full"></span>
            </Link>
          </nav>
        </div>

        <div className="flex-1 flex justify-end">
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-6 py-2.5 rounded-full bg-white/80 backdrop-blur-sm border border-gray-100 text-[#FF561E] font-semibold text-[14px] hover:bg-white hover:scale-105 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(255,86,30,0.15)] hover:border-orange-100 transition-all duration-300 shadow-sm">
              Log in
            </Link>
            <Link href="/signup" className="px-6 py-2.5 rounded-full bg-[#FF561E] text-white font-semibold text-[14px] hover:scale-105 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(255,86,30,0.35)] transition-all duration-300 shadow-lg shadow-orange-500/20">
              Sign up
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow w-full">
        <section className="w-full max-w-[820px] mx-auto px-6 md:px-10 pt-16 md:pt-20 text-center">
          <div className="inline-flex items-center px-5 py-2 rounded-full bg-orange-50 border border-orange-100 shadow-[0_2px_10px_rgb(0,0,0,0.03)] mb-6">
            <span className="text-[#FF561E] text-[13px] font-semibold tracking-wide">Help Center</span>
          </div>
          <h1 className="text-[36px] md:text-[48px] leading-[1.12] font-bold text-[#1A1D20] tracking-tight">
            Frequently Asked <span className="text-[#FF561E]">Questions</span>
          </h1>
          <p className="mt-5 text-[16px] md:text-[17px] leading-[1.7] text-[#6B7280]">
            Everything you need to know about eSIM4U from compatibility and activation to data plans, refunds, and
            support.
          </p>
        </section>

        <section className="w-full max-w-[820px] mx-auto px-6 md:px-10 py-12 md:py-16">
          <FaqAccordion items={faqs} />
        </section>

        <section className="w-full max-w-[820px] mx-auto px-6 md:px-10 pb-16 md:pb-24">
          <div className="rounded-3xl bg-[#FFF4F0] border border-orange-100 px-8 py-10 md:px-12 md:py-12 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-[#FF561E] flex items-center justify-center mb-5">
              <Headset className="w-7 h-7 text-white" strokeWidth={2} />
            </div>
            <h2 className="text-[24px] md:text-[28px] font-bold text-[#1A1D20] tracking-tight">Still have questions?</h2>
            <p className="mt-3 text-[15px] md:text-[16px] leading-[1.7] text-[#6B7280] max-w-[480px]">
              Our support team is here to help you stay connected wherever you go. Reach out and we will get back to you
              fast.
            </p>
            <Link
              href="/contact"
              className="mt-7 inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#FF561E] text-white font-semibold text-[15px] hover:scale-105 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(255,86,30,0.35)] transition-all duration-300 shadow-lg shadow-orange-500/20"
            >
              Contact Support
              <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="w-full relative bg-[#FF561E] overflow-hidden pt-8 pb-3 md:pt-10 md:pb-5 font-sans">
        <div className="absolute left-[-5%] md:left-[5%] top-8 bottom-4 w-[40%] md:w-[15%] opacity-15 pointer-events-none">
          <Image src="/assets/tower.svg" alt="Tower Background" fill className="object-contain object-bottom" />
        </div>
        <div className="absolute right-[-5%] md:right-[5%] top-8 bottom-4 w-[40%] md:w-[15%] opacity-15 pointer-events-none">
          <Image src="/assets/tower.svg" alt="Tower Background" fill className="object-contain object-bottom" />
        </div>

        <div className="w-full max-w-[1400px] mx-auto px-4 md:px-6 xl:px-8 flex flex-col xl:flex-row gap-12 xl:gap-10 relative z-10 mb-4 md:mb-6">
          <div className="w-full xl:w-[280px] flex flex-col items-start gap-4 shrink-0">
            <div className="relative h-20 w-64 md:h-[90px] md:w-[280px] -ml-4 lg:-ml-8">
              <Image src="/assets/esim4u-logo.png" alt="eSIM4U" fill className="object-contain object-left brightness-0 invert" />
            </div>
            <div className="flex items-center gap-6 mt-1">
              <a href="#" aria-label="Instagram" className="text-white hover:text-white/80 transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="6" ry="6" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>
              <a href="#" aria-label="Facebook" className="text-white hover:text-white/80 transition-colors">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a href="#" aria-label="X (Twitter)" className="text-white hover:text-white/80 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="#" aria-label="TikTok" className="text-white hover:text-white/80 transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
              </a>
              <a href="#" aria-label="YouTube" className="text-white hover:text-white/80 transition-colors">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21.58 6.55a2.76 2.76 0 0 0-1.95-1.96C17.9 4.1 12 4.1 12 4.1s-5.9 0-7.63.49A2.76 2.76 0 0 0 2.42 6.55C1.94 8.28 1.94 12 1.94 12s0 3.72.48 5.45a2.76 2.76 0 0 0 1.95 1.96C6.1 19.9 12 19.9 12 19.9s5.9 0 7.63-.49a2.76 2.76 0 0 0 1.95-1.96C22.06 15.72 22.06 12 22.06 12s0-3.72-.48-5.45zM9.95 15.36V8.64L15.79 12z"/>
                </svg>
              </a>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-2 lg:grid-cols-5 gap-y-12 gap-x-6 xl:gap-2 lg:pl-10">
            <div className="flex flex-col gap-6">
              <h4 className="font-bold text-[15px] tracking-wide text-white mb-1">PRODUCT</h4>
              <div className="flex flex-col gap-4">
                <Link href="/dashboard/browse" className="text-white hover:text-white/80 text-[15px] font-medium transition-colors leading-relaxed">Buy eSIM</Link>
                <Link href="/#where-next" className="text-white hover:text-white/80 text-[15px] font-medium transition-colors leading-relaxed">Countries</Link>
                <Link href="/#how-it-works" className="text-white hover:text-white/80 text-[15px] font-medium transition-colors leading-relaxed">How it works</Link>
                <Link href="/#coverage" className="text-white hover:text-white/80 text-[15px] font-medium transition-colors leading-relaxed">Coverage</Link>
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <h4 className="font-bold text-[15px] tracking-wide text-white mb-1">COMPANY</h4>
              <div className="flex flex-col gap-4">
                <Link href="/about-us" className="text-white hover:text-white/80 text-[15px] font-medium transition-colors leading-relaxed">About us</Link>
                <Link href="/blog" className="text-white hover:text-white/80 text-[15px] font-medium transition-colors leading-relaxed">Blog</Link>
                <Link href="/contact" className="text-white hover:text-white/80 text-[15px] font-medium transition-colors leading-relaxed">Contact us</Link>
                <Link href="/affiliate" className="text-white hover:text-white/80 text-[15px] font-medium transition-colors leading-relaxed">Affiliate Program</Link>
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <h4 className="font-bold text-[15px] tracking-wide text-white mb-1">SUPPORT</h4>
              <div className="flex flex-col gap-4">
                <Link href="/help-center" className="text-white hover:text-white/80 text-[15px] font-medium transition-colors leading-relaxed">Help Center</Link>
                <Link href="/installation" className="text-white hover:text-white/80 text-[15px] font-medium transition-colors leading-relaxed">Installation Guide</Link>
                <Link href="/refund-policy" className="text-white hover:text-white/80 text-[15px] font-medium transition-colors leading-relaxed">Refund Policy</Link>
                <Link href="/terms" className="text-white hover:text-white/80 text-[15px] font-medium transition-colors leading-relaxed">Terms of Service</Link>
                <Link href="/privacy" className="text-white hover:text-white/80 text-[15px] font-medium transition-colors leading-relaxed">Privacy Policy</Link>
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <h4 className="font-bold text-[15px] tracking-wide text-white mb-1">ACCOUNT</h4>
              <div className="flex flex-col gap-4">
                <Link href="/my-account" className="text-white hover:text-white/80 text-[15px] font-medium transition-colors leading-relaxed">My Account</Link>
                <Link href="/my-orders" className="text-white hover:text-white/80 text-[15px] font-medium transition-colors leading-relaxed">My Orders</Link>
                <Link href="/track-order" className="text-white hover:text-white/80 text-[15px] font-medium transition-colors leading-relaxed">Track Order</Link>
                <Link href="/refer-and-earn" className="text-white hover:text-white/80 text-[15px] font-medium transition-colors leading-relaxed">Refer &amp; Earn</Link>
              </div>
            </div>
            <div className="flex flex-col items-center gap-6 lg:w-[260px]">
              <h4 className="font-bold text-[15px] tracking-wide text-white text-center w-full">STAY CONNECTED</h4>
              <div className="flex flex-col items-center w-full">
                <p className="text-white text-[15px] font-medium leading-[1.6] text-center mb-5">
                  Get travel tips and exclusive offers.
                </p>
                <div className="relative w-full">
                  <input type="email" placeholder="Enter your email" className="w-full pl-4 pr-12 py-[10px] rounded-full text-[14px] text-[#1A1D20] bg-white outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-white/50 shadow-sm" />
                  <button className="absolute right-1 top-1 bottom-1 w-9 bg-[#FF561E] text-white flex items-center justify-center rounded-full transition-colors shadow-sm" aria-label="Send">
                    <ArrowRight className="w-4 h-4 text-white" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full text-center relative z-10 pt-6 mt-4">
          <p className="text-white/80 text-[14px] font-medium">© 2026 eSIM4U. All Rights Reserved</p>
        </div>
      </footer>
    </div>
  );
}
