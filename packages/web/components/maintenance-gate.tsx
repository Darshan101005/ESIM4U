"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import type { MaintenanceSettings } from "@/lib/site-settings-types";
import { isMaintenanceActive, formatMaintenanceWindow } from "@/lib/site-settings-types";

function WrenchIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#FF561E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

/**
 * Maintenance gate. The maintenance state is passed in from the server (root
 * layout) so the decision is in the initial HTML — no flash / false page shown.
 *
 * - Landing page ("/"): shows a small, non-blocking popup (people can still see
 *   the homepage), but every link from it leads to a gated route below.
 * - Every other customer route: a full-screen maintenance page (blocks the page).
 * - /admin is never gated so staff can turn maintenance back off.
 */
export default function MaintenanceGate({ maintenance }: { maintenance: MaintenanceSettings }) {
  const pathname = usePathname() || "/";
  const [dismissed, setDismissed] = useState(false);

  if (!maintenance || pathname.startsWith("/admin")) return null;
  if (!isMaintenanceActive(maintenance.website, maintenance.from, maintenance.to)) return null;

  const windowText = formatMaintenanceWindow(maintenance.from, maintenance.to);
  const isLanding = pathname === "/";

  /* ---------- Landing: non-blocking popup ---------- */
  if (isLanding) {
    if (dismissed) return null;
    return (
      <div className="fixed inset-x-0 bottom-0 z-[9998] flex justify-center p-4 sm:p-6">
        <div className="relative w-full max-w-md rounded-2xl border border-orange-100 bg-white p-5 shadow-[0_12px_48px_rgba(0,0,0,0.18)]">
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg text-[#9CA3AF] hover:bg-gray-100"
          >
            ✕
          </button>
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF4F0]">
              <WrenchIcon size={22} />
            </div>
            <div className="min-w-0 pr-4">
              <p className="text-[14px] font-bold text-[#1A1D20]">Scheduled maintenance</p>
              <p className="mt-1 text-[13px] leading-relaxed text-[#6B7280]">{maintenance.message}</p>
              {windowText && <p className="mt-2 text-[12.5px] font-semibold text-[#FF561E]">Scheduled {windowText}</p>}
              <p className="mt-2 text-[12px] text-[#9CA3AF]">Some pages may be unavailable right now.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Everything else: full-screen maintenance page ---------- */
  return (
    <div className="fixed inset-0 z-[99999] overflow-hidden bg-gradient-to-b from-[#FFF4F0] via-white to-white flex items-center justify-center px-6">
      {/* Soft decorative glows */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[560px] rounded-full bg-[#FF561E]/10 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-[#FF7A45]/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-lg text-center">
        {/* Logo */}
        <div className="mx-auto mb-9 h-12 w-[190px] relative">
          <Image src="/assets/esim4u-logo.png" alt="eSIM4U" fill className="object-contain" priority />
        </div>

        {/* Animated icon */}
        <div className="relative mx-auto mb-7 w-24 h-24">
          <span className="absolute inset-0 rounded-full bg-[#FF561E]/15 nf-pulse-ring" />
          <span className="absolute inset-0 rounded-full bg-[#FF561E]/10 nf-pulse-ring" style={{ animationDelay: "1.5s" }} />
          <div className="relative w-24 h-24 rounded-3xl bg-white shadow-[0_12px_40px_rgba(255,86,30,0.18)] border border-orange-100 flex items-center justify-center">
            <WrenchIcon size={40} />
          </div>
        </div>

        {/* Chip */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-orange-100 shadow-sm mb-5">
          <span className="w-2 h-2 rounded-full bg-[#FF561E] animate-pulse" />
          <span className="text-[13px] font-semibold tracking-wide text-[#FF561E]">Under maintenance</span>
        </div>

        <h1 className="text-[30px] sm:text-[40px] leading-[1.1] font-semibold text-[#1A1D20] tracking-tight">
          We&apos;ll be{" "}
          <span className="text-[#FF561E] font-serif italic font-medium">right back</span>
        </h1>
        <p className="mt-4 text-[15px] sm:text-[16.5px] leading-[1.7] text-[#5E6673] max-w-[460px] mx-auto">
          {maintenance.message}
        </p>
        {windowText && (
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FFF4F0] border border-orange-100 text-[13.5px] font-semibold text-[#FF561E]">
            🗓 Scheduled {windowText}
          </div>
        )}
      </div>
    </div>
  );
}
