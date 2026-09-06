import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  RefreshCw,
  Rocket,
  Headset,
  DollarSign,
  EyeOff,
  Package,
  Zap,
} from "lucide-react";
import AnimatedStats from "@/components/animated-stats";
import SiteFooter from "@/components/marketing/site-footer";

export const metadata: Metadata = {
  title: "About Us | eSIM4U",
  description:
    "Redefining global connectivity with cutting-edge eSIM technology. Learn about our mission, money-back guarantee, and best-in-class pricing.",
};

const guaranteeFeatures = [
  { icon: ShieldCheck, label: "Risk-Free Purchase" },
  { icon: RefreshCw, label: "Easy Refund Process" },
  { icon: Rocket, label: "Fast Processing" },
  { icon: Headset, label: "Customer Support Help" },
];

const pricingFeatures = [
  { icon: DollarSign, label: "Affordable Rates" },
  { icon: EyeOff, label: "No Hidden Fees" },
  { icon: Package, label: "Flexible Packages" },
  { icon: Zap, label: "Instant Activation" },
];

export default function AboutUsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      <header className="w-full px-5 sm:px-8 md:px-12 xl:px-16 pt-6 sm:pt-8 flex items-center justify-between relative z-50">
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
            <Link href="/about-us" className="relative text-[#FF561E]">
              About Us
              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-[2.5px] bg-[#FF561E] rounded-full"></span>
            </Link>
            <Link href="/faq" className="hover:text-[#FF561E] transition-colors">FAQs</Link>
            <Link href="/download" className="hover:text-[#FF561E] transition-colors">Download App</Link>
          </nav>
        </div>

        <div className="flex-1 flex justify-end">
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-white/80 backdrop-blur-sm border border-gray-100 text-[#FF561E] font-semibold text-[13px] sm:text-[14px] hover:bg-white hover:scale-105 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(255,86,30,0.15)] hover:border-orange-100 transition-all duration-300 shadow-sm">
              Log in
            </Link>
            <Link href="/signup" className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-[#FF561E] text-white font-semibold text-[13px] sm:text-[14px] hover:scale-105 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(255,86,30,0.35)] transition-all duration-300 shadow-lg shadow-orange-500/20">
              Sign up
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow w-full">
        <section className="w-full max-w-[1200px] mx-auto px-6 md:px-10 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <h2 className="text-[40px] md:text-[46px] xl:text-[54px] leading-[1.12] font-semibold text-[#1A1D20] tracking-tight">
                Redefining{" "}
                <span className="text-[#FF561E] font-serif italic font-medium tracking-normal">Connectivity</span>
                <br />
                with eSIM Technology
              </h2>
              <p className="mt-6 text-[16px] leading-[1.8] text-[#6B7280] max-w-[520px]">
                We are revolutionizing mobile connectivity through cutting-edge eSIM technology, delivering seamless,
                flexible, and borderless communication solutions. As a leading eSIM service provider, our mission is to
                empower users with instant access to global networks anytime, anywhere without the limitations of
                traditional SIM cards.
              </p>
              <div className="mt-10">
                <AnimatedStats />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <Image
                src="/assets/About/connectivity.png"
                alt="Person using an eSIM-connected smartphone with global plans"
                width={1382}
                height={1138}
                className="w-full h-auto"
                priority
              />
            </div>
          </div>
        </section>

        <section className="w-full bg-[#F8FAF9]">
          <div className="w-full max-w-[1200px] mx-auto px-6 md:px-10 py-16 md:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <Image
                  src="/assets/About/Money_back.png"
                  alt="Satisfied customer covered by the money-back guarantee"
                  width={1434}
                  height={1097}
                  className="w-full h-auto"
                />
              </div>
              <div>
                <h2 className="text-[40px] md:text-[46px] xl:text-[54px] leading-[1.12] font-semibold text-[#1A1D20] tracking-tight">
                  Money-Back{" "}
                  <span className="text-[#FF561E] font-serif italic font-medium tracking-normal">Guarantee</span>
                </h2>
                <p className="mt-6 text-[16px] leading-[1.8] text-[#6B7280] max-w-[520px]">
                  Not satisfied? Get a full refund, hassle-free! If your eSIM doesn&apos;t work, we&apos;ll refund your
                  money. We stand by our service, no questions asked. Get a refund if your eSIM doesn&apos;t activate as
                  promised. Reliable service with a money-back guarantee.
                </p>
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {guaranteeFeatures.map((feature) => (
                    <div
                      key={feature.label}
                      className="flex items-center gap-3 px-5 py-4 rounded-xl border border-gray-200 bg-white"
                    >
                      <feature.icon className="w-5 h-5 text-[#1A1D20] shrink-0" strokeWidth={2} />
                      <span className="text-[15px] font-semibold text-[#1A1D20]">{feature.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full max-w-[1200px] mx-auto px-6 md:px-10 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <h2 className="text-[40px] md:text-[46px] xl:text-[54px] leading-[1.12] font-semibold text-[#1A1D20] tracking-tight">
                Flexible Pricing Plans for Every{" "}
                <span className="text-[#FF561E] font-serif italic font-medium tracking-normal">Traveler</span>
              </h2>
              <p className="mt-6 text-[16px] leading-[1.8] text-[#6B7280] max-w-[520px]">
                Get the best eSIM rates with flexible data options. High-speed data at budget-friendly prices.
                Transparent pricing with no surprises. Choose the perfect plan for your needs. Enjoy seamless coverage
                without overspending.
              </p>
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pricingFeatures.map((feature) => (
                  <div
                    key={feature.label}
                    className="flex items-center gap-3 px-5 py-4 rounded-xl border border-gray-200 bg-white"
                  >
                    <feature.icon className="w-5 h-5 text-[#1A1D20] shrink-0" strokeWidth={2} />
                    <span className="text-[15px] font-semibold text-[#1A1D20]">{feature.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <Image
                src="/assets/About/pricing.png"
                alt="Customer browsing affordable eSIM data plans on a phone"
                width={1413}
                height={1113}
                className="w-full h-auto"
              />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
