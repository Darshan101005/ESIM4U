import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const linkCls =
  "text-white hover:text-white/80 text-[15px] font-medium transition-colors leading-relaxed";

/**
 * Shared marketing footer used across the landing page and all public pages
 * (about, faq, legal, blog, contact, etc.). Keeping it in one place means the
 * link structure stays consistent and only needs editing once.
 */
export default function SiteFooter() {
  return (
    <footer className="w-full relative bg-[#FF561E] overflow-hidden pt-8 pb-3 md:pt-10 md:pb-5 font-sans">
      <div className="absolute left-[5%] top-8 bottom-4 w-[15%] opacity-15 pointer-events-none hidden sm:block">
        <Image src="/assets/tower.svg" alt="" fill className="object-contain object-bottom" />
      </div>
      <div className="absolute right-[5%] top-8 bottom-4 w-[15%] opacity-15 pointer-events-none hidden sm:block">
        <Image src="/assets/tower.svg" alt="" fill className="object-contain object-bottom" />
      </div>

      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-6 xl:px-8 flex flex-col xl:flex-row gap-12 xl:gap-10 relative z-10 mb-4 md:mb-6">
        <div className="w-full xl:w-[280px] flex flex-col items-center md:items-start gap-4 shrink-0">
          <div className="relative h-20 w-64 md:h-[90px] md:w-[280px] md:-ml-4 lg:-ml-8">
            <Image src="/assets/esim4u-logo.png" alt="eSIM4U" fill className="object-contain object-center md:object-left brightness-0 invert" />
          </div>
          <div className="flex items-center justify-center gap-6 mt-1">
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
                <path d="M21.58 6.55a2.76 2.76 0 0 0-1.95-1.96C17.9 4.1 12 4.1 12 4.1s-5.9 0-7.63.49A2.76 2.76 0 0 0 2.42 6.55C1.94 8.28 1.94 12 1.94 12s0 3.72.48 5.45a2.76 2.76 0 0 0 1.95 1.96C6.1 19.9 12 19.9 12 19.9s5.9 0 7.63-.49a2.76 2.76 0 0 0 1.95-1.96C22.06 15.72 22.06 12 22.06 12s0-3.72-.48-5.45zM9.95 15.36V8.64L15.79 12z" />
              </svg>
            </a>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-2 lg:grid-cols-5 gap-y-10 gap-x-8 lg:gap-y-12 lg:gap-x-6 xl:gap-2 lg:pl-10">
          <div className="flex flex-col gap-6">
            <h4 className="font-bold text-[15px] tracking-wide text-white mb-1">PRODUCT</h4>
            <div className="flex flex-col gap-4">
              <Link href="/dashboard/browse" className={linkCls}>Buy eSIM</Link>
              <Link href="/#where-next" className={linkCls}>Countries</Link>
              <Link href="/#how-it-works" className={linkCls}>How it works</Link>
              <Link href="/#coverage" className={linkCls}>Coverage</Link>
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <h4 className="font-bold text-[15px] tracking-wide text-white mb-1">COMPANY</h4>
            <div className="flex flex-col gap-4">
              <Link href="/about-us" className={linkCls}>About us</Link>
              <Link href="/blog" className={linkCls}>Blog</Link>
              <Link href="/contact" className={linkCls}>Contact us</Link>
              <Link href="/affiliate" className={linkCls}>Affiliate Program</Link>
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <h4 className="font-bold text-[15px] tracking-wide text-white mb-1">SUPPORT</h4>
            <div className="flex flex-col gap-4">
              <Link href="/help-center" className={linkCls}>Help Center</Link>
              <Link href="/installation" className={linkCls}>Installation Guide</Link>
              <Link href="/faq" className={linkCls}>FAQs</Link>
              <Link href="/contact" className={linkCls}>Contact us</Link>
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <h4 className="font-bold text-[15px] tracking-wide text-white mb-1">LEGAL</h4>
            <div className="flex flex-col gap-4">
              <Link href="/terms" className={linkCls}>Terms of Service</Link>
              <Link href="/privacy" className={linkCls}>Privacy Policy</Link>
              <Link href="/refund-policy" className={linkCls}>Refund Policy</Link>
              <Link href="/cookie-policy" className={linkCls}>Cookie Policy</Link>
            </div>
          </div>
          <div className="flex flex-col items-center gap-6 lg:w-[260px] col-span-2 lg:col-span-1">
            <h4 className="font-bold text-[15px] tracking-wide text-white text-center w-full">STAY CONNECTED</h4>
            <div className="flex flex-col items-center w-full max-w-[320px]">
              <p className="text-white text-[15px] font-medium leading-[1.6] text-center mb-5">
                Get travel tips and exclusive offers.
              </p>
              <form action="mailto:support@esim4u.uk" method="post" encType="text/plain" className="relative w-full">
                <input type="email" name="email" placeholder="Enter your email" className="w-full pl-4 pr-12 py-[10px] rounded-full text-[14px] text-[#1A1D20] bg-white outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-white/50 shadow-sm" />
                <button type="submit" className="absolute right-1 top-1 bottom-1 w-9 bg-[#FF561E] text-white flex items-center justify-center rounded-full transition-colors shadow-sm" aria-label="Subscribe">
                  <ArrowRight className="w-4 h-4 text-white" strokeWidth={2.5} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full text-center relative z-10 pt-6 mt-4 border-t border-white/15">
        <p className="text-white/80 text-[14px] font-medium">© 2026 eSIM4U. All Rights Reserved</p>
      </div>
    </footer>
  );
}
