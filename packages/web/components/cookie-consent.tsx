"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";
import { useSiteSettings } from "@/lib/use-site-settings";

const STORAGE_KEY = "esim4u_cookie_consent";

interface ConsentValue {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  ts: number;
}

export default function CookieConsent() {
  const settings = useSiteSettings();
  const [visible, setVisible] = useState(false);
  const [managing, setManaging] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(true);

  useEffect(() => {
    let show = false;
    try {
      show = !localStorage.getItem(STORAGE_KEY);
    } catch {
      show = true;
    }
    if (!show) return undefined;
    // Small delay so it doesn't fight with first paint.
    const t = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(t);
  }, []);

  const save = (value: ConsentValue) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {}
    setVisible(false);
  };

  const acceptAll = () => save({ essential: true, analytics: true, marketing: true, ts: Date.now() });
  const rejectNonEssential = () => save({ essential: true, analytics: false, marketing: false, ts: Date.now() });
  const saveChoices = () => save({ essential: true, analytics, marketing, ts: Date.now() });

  if (!settings.features.cookieConsent) return null;
  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] pointer-events-none">
      <div className="pointer-events-auto w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl bg-white border border-gray-200 shadow-[0_12px_48px_rgba(0,0,0,0.18)] overflow-hidden">
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFF4F0] flex items-center justify-center shrink-0">
              <Cookie className="w-5 h-5 text-[#FF561E]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[15px] font-bold text-[#1A1D20]">We use cookies</h2>
                <button onClick={rejectNonEssential} aria-label="Dismiss (reject non-essential)" className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[13px] text-[#6B7280] leading-relaxed mt-1">
                We use essential cookies to run the site and, with your consent, optional cookies for analytics and
                offers. See our{" "}
                <Link href="/privacy" className="text-[#FF561E] font-semibold underline underline-offset-2">Privacy Policy</Link>.
              </p>
            </div>
          </div>

          {managing && (
            <div className="mt-4 space-y-2.5 rounded-xl bg-[#FAFAFA] border border-gray-100 p-4">
              <label className="flex items-center justify-between gap-3 opacity-70">
                <span className="text-[13px] font-semibold text-[#1A1D20]">Essential <span className="font-normal text-[#9CA3AF]">· always on</span></span>
                <input type="checkbox" checked readOnly className="w-4 h-4 accent-[#FF561E]" />
              </label>
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <span className="text-[13px] font-semibold text-[#1A1D20]">Analytics</span>
                <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} className="w-4 h-4 accent-[#FF561E]" />
              </label>
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <span className="text-[13px] font-semibold text-[#1A1D20]">Marketing</span>
                <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="w-4 h-4 accent-[#FF561E]" />
              </label>
            </div>
          )}

          <div className="mt-4 space-y-2">
            {managing ? (
              <button onClick={saveChoices} className="w-full px-5 py-2.5 rounded-full bg-[#FF561E] text-white font-semibold text-[13px]">
                Save choices
              </button>
            ) : (
              <button onClick={acceptAll} className="w-full px-5 py-2.5 rounded-full bg-[#FF561E] text-white font-semibold text-[13px]">
                Accept all
              </button>
            )}
            <div className="flex gap-2">
              <button onClick={rejectNonEssential} className="flex-1 px-3 py-2.5 rounded-full bg-white border border-gray-200 text-[#1A1D20] font-semibold text-[12.5px]">
                Reject non-essential
              </button>
              <button onClick={() => setManaging((m) => !m)} className="px-4 py-2.5 rounded-full text-[#6B7280] font-semibold text-[12.5px] hover:text-[#FF561E] transition-colors shrink-0">
                {managing ? "Hide" : "Manage"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
