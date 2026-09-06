// Client-safe types + defaults (no DB imports) so both server and client can use them.

export interface SocialLink {
  url: string;
  enabled: boolean;
}

export interface SiteSettings {
  contactEmail: string;
  whatsapp: string;
  socials: {
    instagram: SocialLink;
    facebook: SocialLink;
    x: SocialLink;
    tiktok: SocialLink;
    youtube: SocialLink;
  };
  features: {
    topup: boolean;
    referrals: boolean;
    affiliate: boolean;
    blog: boolean;
    cookieConsent: boolean;
  };
  maintenance: {
    website: boolean;
    bot: boolean;
    message: string;
    /** Optional schedule window as datetime-local strings ("YYYY-MM-DDTHH:mm"). */
    from: string;
    to: string;
  };
}

export type SocialKey = keyof SiteSettings["socials"];

export type MaintenanceSettings = SiteSettings["maintenance"];

/**
 * Whether maintenance is currently *active* for a given surface (website/bot).
 * - toggle off → never active
 * - a `from`/`to` window narrows when it applies; before `from` or after `to`
 *   it is not active (so a schedule can be set ahead of time)
 * - no window → active immediately while the toggle is on
 */
export function isMaintenanceActive(enabled: boolean, from?: string, to?: string, now: number = Date.now()): boolean {
  if (!enabled) return false;
  const f = from ? Date.parse(from) : NaN;
  const t = to ? Date.parse(to) : NaN;
  if (!Number.isNaN(f) && now < f) return false;
  if (!Number.isNaN(t) && now > t) return false;
  return true;
}

/** True when maintenance is enabled and scheduled to *start later*. */
export function isMaintenanceUpcoming(enabled: boolean, from?: string, now: number = Date.now()): boolean {
  if (!enabled) return false;
  const f = from ? Date.parse(from) : NaN;
  return !Number.isNaN(f) && now < f;
}

/** Human-readable schedule window, e.g. "from Jan 5, 3:00 PM to Jan 5, 5:00 PM". */
export function formatMaintenanceWindow(from?: string, to?: string): string {
  const fmt = (s: string) => {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  };
  const f = from ? fmt(from) : "";
  const t = to ? fmt(to) : "";
  if (f && t) return `from ${f} to ${t}`;
  if (f) return `from ${f}`;
  if (t) return `until ${t}`;
  return "";
}

/** Build a wa.me link from a phone number (strips spaces, +, dashes). */
export function toWaLink(phone: string): string {
  const digits = (phone || "").replace(/[^\d]/g, "");
  return digits ? `https://wa.me/${digits}` : "#";
}

export const DEFAULT_SETTINGS: SiteSettings = {
  contactEmail: "support@esim4u.uk",
  whatsapp: "+92 323 9539487",
  socials: {
    // Enabled by default so the footer isn't empty; add the URL any time.
    instagram: { url: "", enabled: true },
    facebook: { url: "", enabled: true },
    x: { url: "", enabled: true },
    tiktok: { url: "", enabled: true },
    youtube: { url: "", enabled: true },
  },
  features: { topup: true, referrals: true, affiliate: true, blog: true, cookieConsent: true },
  maintenance: {
    website: false,
    bot: false,
    message: "We're doing some scheduled maintenance and will be back shortly. Thanks for your patience!",
    from: "",
    to: "",
  },
};
