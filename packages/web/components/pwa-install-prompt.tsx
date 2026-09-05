"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X, Download, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "esim4u:pwa-dismissed";
const DISMISS_DAYS = 7;

function recentlyDismissed(): boolean {
  try {
    const ts = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return ts > 0 && Date.now() - ts < DISMISS_DAYS * 86400000;
  } catch {
    return false;
  }
}

/**
 * Custom "Install app" banner shown only in the mobile browser — never inside
 * the native app WebView and never when the PWA is already installed.
 * Android/Chrome uses the captured beforeinstallprompt; iOS Safari shows the
 * Share → Add to Home Screen hint (iOS has no install API).
 */
export default function PwaInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const w = window as unknown as { __ESIM4U_APP__?: boolean };
    const nav = navigator as unknown as { standalone?: boolean };

    const inApp = w.__ESIM4U_APP__ === true || /ESIM4UApp/i.test(navigator.userAgent);
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
    const isMobile = window.matchMedia("(max-width: 768px)").matches;

    if (inApp || isStandalone || !isMobile || recentlyDismissed()) return;

    // Android / Chrome: capture the install prompt.
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall as EventListener);

    // iOS Safari has no install API — show the Add to Home Screen hint.
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isSafari = /^((?!chrome|crios|fxios|android).)*safari/i.test(navigator.userAgent);
    if (isIOS && isSafari) {
      setIosHint(true);
      setShow(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall as EventListener);
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
    setShow(false);
  };

  const install = async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      await deferred.userChoice;
    } catch {}
    setDeferred(null);
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[120] md:hidden">
      <div className="mx-auto max-w-md rounded-2xl bg-white border border-gray-100 shadow-[0_12px_40px_rgba(0,0,0,0.18)] p-3.5 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 relative bg-[#FF561E]">
          <Image src="/icons/icon-192.png" alt="ESIM4U" fill className="object-contain" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-bold text-[#1A1D20] leading-tight">Install ESIM4U</p>
          {iosHint ? (
            <p className="text-[11.5px] text-[#6B7280] leading-snug mt-0.5 inline-flex items-center gap-1">
              Tap <Share className="w-3.5 h-3.5 inline text-[#FF561E]" /> then &ldquo;Add to Home Screen&rdquo;
            </p>
          ) : (
            <p className="text-[11.5px] text-[#6B7280] leading-snug mt-0.5">Add it to your home screen for quick access.</p>
          )}
        </div>

        {!iosHint && (
          <button
            onClick={install}
            className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FF561E] text-white text-[13px] font-bold hover:bg-[#E04B18] transition-colors"
          >
            <Download className="w-4 h-4" /> Install
          </button>
        )}

        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-[#1A1D20] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
