import Image from "next/image";
import Link from "next/link";
import NewsletterForm from "@/components/marketing/newsletter-form";
import { FooterSocials, FooterEmailLink } from "@/components/marketing/footer-dynamic";

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
          <FooterSocials />
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
              <FooterEmailLink />
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
              <NewsletterForm />
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
