"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getCachedUser, fetchAndCacheUser } from "@/lib/auth-client";
import ProfileMenu from "@/components/marketing/profile-menu";

const navCls = "hover:text-[#FF561E] transition-colors";

/**
 * Shared marketing header for public pages. Keeps the logo, primary nav and
 * auth buttons consistent across landing/about/faq/legal/blog/contact.
 * When the visitor is signed in it shows Dashboard + profile instead of the
 * Log in / Sign up buttons.
 */
export default function SiteHeader({ active }: { active?: string }) {
  const [authUser, setAuthUser] = useState<{ name?: string; email?: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Show the cached state instantly for returning users (no flip), then
    // confirm against the server in the background.
    const cached = getCachedUser();
    if (cached) { setAuthUser(cached); setAuthChecked(true); }
    fetchAndCacheUser()
      .then((u) => { setAuthUser(u); setAuthChecked(true); })
      .catch(() => setAuthChecked(true));
  }, []);

  return (
    <header className="w-full px-5 sm:px-8 md:px-12 xl:px-16 pt-6 sm:pt-8 flex items-center justify-between relative z-50">
      <div className="flex-1 flex justify-start">
        <Link href="/" className="flex items-center">
          <Image src="/assets/esim4u-logo.png" alt="eSIM4U Logo" width={140} height={42} className="object-contain h-auto w-[110px] sm:w-[140px]" priority />
        </Link>
      </div>

      <div className="hidden lg:flex h-[56px] bg-white/60 backdrop-blur-xl rounded-full shadow-[0_4px_24px_rgb(0,0,0,0.06)] border border-white/60 items-center px-8">
        <nav className="flex items-center gap-8 text-[14px] font-medium text-[#1A1D20]">
          <Link href="/" className={active === "home" ? "text-[#FF561E]" : navCls}>Home</Link>
          <Link href="/#comparison" className={navCls}>Features</Link>
          <Link href="/#destinations" className={navCls}>Destinations</Link>
          <Link href="/#how-it-works" className={navCls}>How It Works</Link>
          <Link href="/about-us" className={active === "about" ? "text-[#FF561E]" : navCls}>About Us</Link>
          <Link href="/faq" className={active === "faq" ? "text-[#FF561E]" : navCls}>FAQs</Link>
          <Link href="/download" className={active === "download" ? "text-[#FF561E]" : navCls}>Download App</Link>
        </nav>
      </div>

      <div className="flex-1 flex justify-end">
        <div className={`flex items-center gap-3 transition-opacity duration-200 ${authChecked ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
          {authUser ? (
            <>
              <Link href="/dashboard" className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-white/80 backdrop-blur-sm border border-gray-100 text-[#FF561E] font-semibold text-[13px] sm:text-[14px] hover:bg-white transition-all shadow-sm">
                Dashboard
              </Link>
              <ProfileMenu name={authUser.name} email={authUser.email} />
            </>
          ) : (
            <>
              <Link href="/login" className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-white/80 backdrop-blur-sm border border-gray-100 text-[#FF561E] font-semibold text-[13px] sm:text-[14px] hover:bg-white transition-all shadow-sm">
                Log in
              </Link>
              <Link href="/signup" className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-[#FF561E] text-white font-semibold text-[13px] sm:text-[14px] hover:scale-105 transition-all shadow-lg shadow-orange-500/20">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
