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
}

export type SocialKey = keyof SiteSettings["socials"];

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
};
