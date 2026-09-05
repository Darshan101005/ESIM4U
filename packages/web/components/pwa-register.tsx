"use client";

import { useEffect } from "react";

/**
 * Registers the service worker so the site is installable as a PWA — but never
 * inside the native app's WebView (the app loads the live site directly).
 */
export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as unknown as { __ESIM4U_APP__?: boolean };
    const inApp = w.__ESIM4U_APP__ === true || /ESIM4UApp/i.test(navigator.userAgent);
    if (inApp) return;
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return null;
}
