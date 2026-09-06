import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/marketing/site-header";
import SiteFooter from "@/components/marketing/site-footer";
import { Home } from "lucide-react";

export const metadata: Metadata = {
  title: "Page not found (404)",
  description: "The page you're looking for has roamed off the map. Head back home or explore eSIM4U's travel eSIMs.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      <SiteHeader />

      <main className="flex-1 relative overflow-hidden flex items-center justify-center px-5 py-14 sm:py-20">
        {/* Soft decorative glow behind the hero (kept away from the header so the
            top stays a clean, even background). */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[560px] rounded-full bg-[#FF561E]/10 blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] rounded-full bg-[#FF7A45]/10 blur-3xl" />

        <div className="relative z-10 w-full max-w-[820px] mx-auto text-center">
          {/* Error chip */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-orange-100 shadow-sm mb-8">
            <span className="w-2 h-2 rounded-full bg-[#FF561E] animate-pulse" />
            <span className="text-[13px] font-semibold tracking-wide text-[#FF561E]">Error 404</span>
          </div>

          {/* 4 — globe — 4 (the whole group floats up & down) */}
          <div className="relative flex items-center justify-center gap-3 sm:gap-6 select-none nf-float">
            <span className="text-[110px] sm:text-[180px] leading-none font-extrabold bg-gradient-to-br from-[#FF561E] to-[#FF9A6A] bg-clip-text text-transparent">
              4
            </span>

            {/* Globe as the "0" */}
            <div className="relative w-[110px] h-[110px] sm:w-[180px] sm:h-[180px]">
              {/* Soft pulse rings */}
              <span className="absolute inset-0 rounded-full bg-[#FF561E]/20 nf-pulse-ring" />
              <span className="absolute inset-0 rounded-full bg-[#FF561E]/10 nf-pulse-ring" style={{ animationDelay: "1.5s" }} />

              <svg viewBox="0 0 200 200" className="relative w-full h-full">
                <defs>
                  <radialGradient id="nfGlobe" cx="38%" cy="34%" r="75%">
                    <stop offset="0%" stopColor="#FF9A6A" />
                    <stop offset="55%" stopColor="#FF561E" />
                    <stop offset="100%" stopColor="#E0431A" />
                  </radialGradient>
                </defs>

                {/* Globe */}
                <circle cx="100" cy="100" r="62" fill="url(#nfGlobe)" />

                {/* Latitude lines (static) */}
                <g fill="none" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="1.6">
                  <line x1="38" y1="100" x2="162" y2="100" />
                  <ellipse cx="100" cy="100" rx="62" ry="26" />
                  <ellipse cx="100" cy="100" rx="62" ry="48" />
                </g>

                {/* Meridians sweeping across the face — makes the globe look like
                    it's slowly rotating on its axis (Earth spin). */}
                <g fill="none" stroke="#ffffff" strokeWidth="1.6">
                  <ellipse cx="100" cy="100" ry="62" rx="22" strokeOpacity="0.5">
                    <animate attributeName="rx" values="22;62;22" dur="14s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.4 0 0.6 1;0.4 0 0.6 1" />
                    <animate attributeName="stroke-opacity" values="0.5;0.15;0.5" dur="14s" repeatCount="indefinite" />
                  </ellipse>
                  <ellipse cx="100" cy="100" ry="62" rx="62" strokeOpacity="0.15">
                    <animate attributeName="rx" values="62;22;62" dur="14s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.4 0 0.6 1;0.4 0 0.6 1" />
                    <animate attributeName="stroke-opacity" values="0.15;0.5;0.15" dur="14s" repeatCount="indefinite" />
                  </ellipse>
                </g>
              </svg>
            </div>

            <span className="text-[110px] sm:text-[180px] leading-none font-extrabold bg-gradient-to-br from-[#FF561E] to-[#FF9A6A] bg-clip-text text-transparent">
              4
            </span>
          </div>

          {/* Copy */}
          <h1 className="mt-8 text-[28px] sm:text-[40px] leading-[1.1] font-semibold text-[#1A1D20] tracking-tight">
            Looks like this page{" "}
            <span className="text-[#FF561E] font-serif italic font-medium">roamed off</span> the map
          </h1>
          <p className="mt-4 text-[15px] sm:text-[17px] leading-[1.7] text-[#5E6673] max-w-[520px] mx-auto">
            The page you&apos;re looking for doesn&apos;t exist or has moved. But don&apos;t worry — you&apos;re never
            without a connection with eSIM4U. Let&apos;s get you back on track.
          </p>

          {/* Action */}
          <div className="mt-9 flex items-center justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#FF561E] text-white text-[15px] font-bold hover:bg-[#E04B18] hover:-translate-y-0.5 transition-all shadow-lg shadow-orange-500/25"
            >
              <Home className="w-5 h-5" /> Back to home
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
