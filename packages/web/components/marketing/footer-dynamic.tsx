"use client";

import { useSiteSettings } from "@/lib/use-site-settings";

const linkCls = "text-white hover:text-white/80 text-[15px] font-medium transition-colors leading-relaxed";

/** Footer social icons — only the ones with a URL set in Manage Website show. */
export function FooterSocials() {
  const s = useSiteSettings();
  const items: { key: string; enabled: boolean; url: string; label: string; svg: React.ReactNode }[] = [
    {
      key: "instagram", enabled: s.socials.instagram.enabled, url: s.socials.instagram.url, label: "Instagram",
      svg: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="20" x="2" y="2" rx="6" ry="6" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      ),
    },
    {
      key: "facebook", enabled: s.socials.facebook.enabled, url: s.socials.facebook.url, label: "Facebook",
      svg: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      ),
    },
    {
      key: "x", enabled: s.socials.x.enabled, url: s.socials.x.url, label: "X (Twitter)",
      svg: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      key: "tiktok", enabled: s.socials.tiktok.enabled, url: s.socials.tiktok.url, label: "TikTok",
      svg: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
        </svg>
      ),
    },
    {
      key: "youtube", enabled: s.socials.youtube.enabled, url: s.socials.youtube.url, label: "YouTube",
      svg: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21.58 6.55a2.76 2.76 0 0 0-1.95-1.96C17.9 4.1 12 4.1 12 4.1s-5.9 0-7.63.49A2.76 2.76 0 0 0 2.42 6.55C1.94 8.28 1.94 12 1.94 12s0 3.72.48 5.45a2.76 2.76 0 0 0 1.95 1.96C6.1 19.9 12 19.9 12 19.9s5.9 0 7.63-.49a2.76 2.76 0 0 0 1.95-1.96C22.06 15.72 22.06 12 22.06 12s0-3.72-.48-5.45zM9.95 15.36V8.64L15.79 12z" />
        </svg>
      ),
    },
    {
      key: "telegram", enabled: s.socials.telegram.enabled, url: s.socials.telegram.url, label: "Telegram",
      svg: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
        </svg>
      ),
    },
  ];

  // Show an icon whenever it's enabled (so the footer isn't empty); link to the
  // URL if one is set, otherwise it's a non-navigating placeholder.
  const active = items.filter((i) => i.enabled);
  if (active.length === 0) return null;

  return (
    <div className="w-full flex items-center justify-center gap-5 sm:gap-6 mt-2 flex-wrap">
      {active.map((i) => (
        <a
          key={i.key}
          href={i.url && i.url.trim() ? i.url : "#"}
          target={i.url && i.url.trim() ? "_blank" : undefined}
          rel="noopener noreferrer"
          aria-label={i.label}
          className="text-white hover:text-white/80 transition-colors"
        >
          {i.svg}
        </a>
      ))}
    </div>
  );
}

/** Footer "Email us" link using the globally-managed contact email. */
export function FooterEmailLink() {
  const s = useSiteSettings();
  return (
    <a href={`mailto:${s.contactEmail}`} className={linkCls}>Email us</a>
  );
}
