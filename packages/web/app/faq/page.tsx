import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Headset } from "lucide-react";
import FaqAccordion, { FaqItem } from "@/components/faq-accordion";
import SiteFooter from "@/components/marketing/site-footer";

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
    question: "If I delete my eSIM, can I use or install it again?",
    answer:
      "No. If you delete your eSIM, you cannot use or install it again — it is permanently removed once deleted. If this happens, you will need to purchase a new eSIM for future use, so only remove an eSIM when you are sure you no longer need it.",
  },
  {
    question: "What does the eSIM status \u201creleased\u201d mean?",
    answer:
      "When an eSIM status shows as released, the eSIM profile has been removed from the device and is no longer actively installed. A released profile generally cannot be reused or reinstalled — once deleted it is considered gone and can't be added again. You would need to buy a new eSIM to reconnect.",
  },
  {
    question: "My eSIM shows as enabled but only about 1MB of data is used — is that normal?",
    answer:
      "Yes, this can be completely normal. It usually means the eSIM was installed and activated but little to no mobile data was actually used — for example the device stayed on Wi-Fi, the eSIM wasn't selected as the line for mobile data, or data roaming was turned off. A tiny amount of usage (around 1MB) often just comes from initial network signalling and background activity, not real browsing. To confirm real usage, check data consumption in your device settings.",
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
            <Link href="/download" className="hover:text-[#FF561E] transition-colors">Download App</Link>
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

      <SiteFooter />
    </div>
  );
}
