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
  ArrowRight,
} from "lucide-react";
import AnimatedStats from "@/components/animated-stats";

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
            <Link href="/about-us" className="relative text-[#FF561E]">
              About Us
              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-[2.5px] bg-[#FF561E] rounded-full"></span>
            </Link>
            <Link href="/faq" className="hover:text-[#FF561E] transition-colors">FAQs</Link>
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
                src="/assets/about/Connectivity.png"
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
                  src="/assets/about/Money_back.png"
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
                src="/assets/about/Pricing.png"
                alt="Customer browsing affordable eSIM data plans on a phone"
                width={1413}
                height={1113}
                className="w-full h-auto"
              />
            </div>
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
