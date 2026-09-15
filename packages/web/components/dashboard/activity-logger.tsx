"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";

// Logs one "session" activity row per browser session when a signed-in user
// opens the dashboard — regardless of how they logged in (email OR Google).
// This is what captures device / IP / geo for EVERY customer, not just those
// who used the email/password form. Deduped per tab session so it doesn't spam.
const FLAG = "esim4u:session-logged";

export default function ActivityLogger() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem(FLAG)) return;
    } catch {
      return;
    }

    (async () => {
      try {
        const res = await authClient.getSession();
        const user = (res as { data?: { user?: { id?: string; email?: string } } } | null)?.data?.user;
        if (!user?.id && !user?.email) return; // not signed in yet — log on a later mount
        // Mark seen only once we have a real user, so a login later in the same
        // tab still gets logged (don't burn the flag on a signed-out mount).
        try {
          sessionStorage.setItem(FLAG, "1");
        } catch {}
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
