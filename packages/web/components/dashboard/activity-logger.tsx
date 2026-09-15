"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";

// Logs one "session" activity row per (browser tab-session × user) when a
// signed-in user opens the dashboard — regardless of how they logged in
// (email OR Google). This is what captures device / IP / geo for EVERY
// customer, not just those who used the email/password form.
//
// The dedupe key stores the *user id*, not just a boolean. That matters because
// sessionStorage survives a log out → log in of a DIFFERENT account in the same
// tab; a plain boolean flag would then skip the second user and never record
// their device/session. Keying by user id logs each account once per tab.
const FLAG = "esim4u:session-logged-for";

export default function ActivityLogger() {
  useEffect(() => {
    (async () => {
      try {
        const res = await authClient.getSession();
        const user = (res as { data?: { user?: { id?: string; email?: string } } } | null)?.data?.user;
        const key = user?.id || user?.email;
        if (!key) return; // not signed in yet — a later mount will log it

        // Skip only if THIS user was already logged in this tab-session.
        try {
          if (sessionStorage.getItem(FLAG) === key) return;
          sessionStorage.setItem(FLAG, key);
        } catch {
          // sessionStorage unavailable — fall through and log (best-effort).
        }

        await fetch("/api/auth/activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventType: "session", userId: user.id, email: user.email }),
        });
      } catch {
        // best-effort; never blocks the dashboard
      }
    })();
  }, []);

  return null;
}
