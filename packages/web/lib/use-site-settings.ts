"use client";

import { useEffect, useState } from "react";
import { DEFAULT_SETTINGS, type SiteSettings } from "@/lib/site-settings-types";

// Simple module-level cache so we fetch the public settings once per session.
let cache: SiteSettings | null = null;

export function useSiteSettings(): SiteSettings {
  const [settings, setSettings] = useState<SiteSettings>(cache || DEFAULT_SETTINGS);

  useEffect(() => {
    if (cache) return;
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && !d.error) {
          cache = d as SiteSettings;
          setSettings(cache);
        }
      })
      .catch(() => {});
  }, []);

  return settings;
}
