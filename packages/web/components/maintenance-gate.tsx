"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useSiteSettings } from "@/lib/use-site-settings";
import { isMaintenanceActive, isMaintenanceUpcoming, formatMaintenanceWindow } from "@/lib/site-settings-types";

function WrenchIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#FF561E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

/**
 * Maintenance UX for the customer-facing site (never affects /admin):
 *  - On /login and /signup: a full-screen block while maintenance is ACTIVE, so
 *    no new sign-ins or sign-ups happen. Existing logged-in sessions are left
 *    completely undisturbed (the dashboard is never gated here).
 *  - On the landing / public pages: a dismissible popup announcing maintenance
 *    (or upcoming scheduled maintenance), including the time window if set.
 *
 * This is a UX layer; the admin toggle in Manage Website is the source of truth.
 */
export default function MaintenanceGate() {
  const pathname = usePathname() || "/";
  const settings = useSiteSettings();
  const [dismissed, setDismissed] = useState(false);

  const m = settings.maintenance;
  if (!m || pathname.startsWith("/admin")) return null;

  const active = isMaintenanceActive(m.website, m.from, m.to);
  const upcoming = isMaintenanceUpcoming(m.website, m.from);
  const windowText = formatMaintenanceWindow(m.from, m.to);

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isDashboard = pathname.startsWith("/dashboard");

  // Logged-in area is never disturbed.
  if (isDashboard) return null;

  // Block new logins / signups while maintenance is active.
  if (isAuthPage) {
    if (!active) return null;
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white px-6">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF4F0]">
            <WrenchIcon />
          </div>
          <h1 className="text-[22px] font-bold text-[#1A1D20] mb-2">We&apos;ll be right back</h1>
          <p className="text-[14px] leading-relaxed text-[#6B7280]">{m.message}</p>
          {windowText && (
            <p className="mt-3 text-[13px] font-medium text-[#FF561E]">Scheduled {windowText}</p>
          )}
          <p className="mt-6 text-[12.5px] text-[#9CA3AF]">Sign in and sign up are paused during maintenance.</p>
        </div>
      </div>
    );
  }

  // Landing / public pages: a dismissible announcement popup.
  if ((active || upcoming) && !dismissed) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-[9998] flex justify-center p-4 sm:p-6">
        <div className="relative w-full max-w-md rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_8px_40px_rgba(0,0,0,0.12)]">
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg text-[#9CA3AF] hover:bg-gray-100"
          >
            ✕
          </button>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF4F0]">
              <WrenchIcon size={20} />
            </div>
            <div className="min-w-0 pr-4">
              <p className="text-[14px] font-bold text-[#1A1D20]">
                {upcoming && !active ? "Scheduled maintenance" : "Under maintenance"}
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-[#6B7280]">{m.message}</p>
              {windowText && <p className="mt-2 text-[12.5px] font-medium text-[#FF561E]">Scheduled {windowText}</p>}
              {active && (
                <p className="mt-2 text-[12px] text-[#9CA3AF]">Sign in and sign up are paused right now.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
