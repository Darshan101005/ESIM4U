"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { X, Download, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// One shared key: we stamp it the moment the banner is shown AND when it's
// dismissed, then suppress the banner for 24h. That way it appears at most once
// a day and never re-pops on every page navigation within that day.
const SEEN_KEY = "esim4u:pwa-seen";
const SUPPRESS_MS = 24 * 60 * 60 * 1000; // 1 day

function seenRecently(): boolean {
  try {
    const ts = Number(localStorage.getItem(SEEN_KEY) || 0);
    return ts > 0 && Date.now() - ts < SUPPRESS_MS;
  } catch {
    return false;
  }
}

function markSeen(): void {
  try {
    localStorage.setItem(SEEN_KEY, String(Date.now()));
  } catch {}
}

// Lets the AI chat widget know to hide while the install banner is on screen
// (they'd otherwise overlap at the bottom on mobile).
function broadcast(visible: boolean): void {
  try {
    (window as unknown as { __ESIM4U_INSTALL_OPEN__?: boolean }).__ESIM4U_INSTALL_OPEN__ = visible;
    window.dispatchEvent(new CustomEvent("esim4u:install-banner", { detail: visible }));
  } catch {}
}

/**
 * Custom "Install app" banner shown only on the landing page ("/") in the
 * mobile browser — never inside the native app WebView, never when the PWA is
 * already installed, and at most once per day. Android/Chrome uses the captured
 * beforeinstallprompt; iOS Safari shows the Share -> Add to Home Screen hint.
 */
export default function PwaInstallPrompt() {
  const pathname = usePathname() || "/";
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Landing page only — don't surface it inside the dashboard, admin, or any
    // other route.
    if (pathname !== "/") {
      setShow(false);
      return;
    }

    const w = window as unknown as { __ESIM4U_APP__?: boolean };
    const nav = navigator as unknown as { standalone?: boolean };

    const inApp = w.__ESIM4U_APP__ === true || /ESIM4UApp/i.test(navigator.userAgent);
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
    const isMobile = window.matchMedia("(max-width: 768px)").matches;

    if (inApp || isStandalone || !isMobile || seenRecently()) return;

    // Android / Chrome: capture the install prompt.
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setShow(true);
      markSeen(); // shown once for today
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall as EventListener);

    // iOS Safari has no install API — show the Add to Home Screen hint.
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isSafari = /^((?!chrome|crios|fxios|android).)*safari/i.test(navigator.userAgent);
    if (isIOS && isSafari) {
      setIosHint(true);
      setShow(true);
      markSeen();
    }

    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall as EventListener);
  }, [pathname]);

  // Keep the chat widget in sync with whether the banner is on screen.
  useEffect(() => {
    broadcast(show);
    return () => broadcast(false);
  }, [show]);

  const dismiss = () => {
    markSeen();
    setShow(false);
  };

  const install = async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      await deferred.userChoice;
    } catch {}
    markSeen();
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
