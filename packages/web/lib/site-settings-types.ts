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
    telegram: SocialLink;
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
  /** Admin-editable long-form legal pages, stored as markdown. */
  legal: {
    terms: string;
    privacy: string;
    /** Human-readable "last updated" label shown on both pages. */
    updated: string;
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

export const DEFAULT_TERMS_MD = `These Terms of Service govern your access to and use of the eSIM4U website, mobile experience, and eSIM data plans. By creating an account or purchasing a plan, you agree to these terms.

## 1. About these terms

eSIM4U ("eSIM4U", "we", "us", or "our") provides embedded SIM (eSIM) data plans that let you connect to mobile networks in supported countries and regions. These Terms form a binding agreement between you and eSIM4U. If you do not agree with them, please do not use our services.

## 2. Eligibility and your account

You must be at least 18 years old, or the age of majority in your jurisdiction, to purchase a plan. You are responsible for keeping your account credentials secure and for all activity that occurs under your account. Please provide accurate information and keep it up to date.

## 3. eSIM plans, activation and validity

- Each plan specifies a data allowance, coverage area, and validity period.
- Unless stated otherwise, a plan's validity period begins when the eSIM first connects to a supported network in the destination — not when it is purchased or installed.
- Data allowances are for the stated validity window and do not roll over after expiry.
- Some eSIMs can only be installed once. Please install carefully and keep your QR code.

## 4. Deleting or removing an eSIM

Deleting an eSIM is permanent. If you delete your eSIM, you cannot use or install it again — it is permanently removed once deleted. A profile shown as "released" has been removed from the device and generally cannot be reused or reinstalled. If this happens, you will need to purchase a new eSIM for future use, so only remove an eSIM when you are certain you no longer need it.

## 5. Device compatibility

Our plans require an eSIM-compatible, carrier-unlocked device. It is your responsibility to confirm your device supports eSIM before purchasing. We provide installation guides for iOS and Android, but we cannot guarantee compatibility with every device or carrier lock status.

## 6. Pricing, payment and taxes

Prices are shown in your selected display currency and are charged through our payment processors (Stripe and PayPal). You authorise us to charge your chosen payment method for the total shown at checkout, including any applicable taxes. We may update pricing at any time, but changes do not affect plans already purchased.

## 7. Refunds

Refunds are governed by our [Refund Policy](/refund-policy), including our money-back guarantee for eligible cases and automatic refunds where an eSIM fails to be provisioned after payment.

## 8. Referral and rewards program

Our referral program lets you and a friend each earn account credit when they complete their first eligible purchase using your referral code. Credits have no cash value, cannot be transferred, and may be subject to minimum-purchase or other conditions. We may modify or end the program, or withdraw credits obtained through fraud or abuse, at any time.

## 9. Acceptable use and included VPN

You agree to use our services lawfully and not to resell, tamper with, or use them to send spam, infringe rights, or breach any applicable law or the policies of the underlying networks. Where a plan includes VPN access, it is provided to help you reach services that may be restricted in certain regions and is subject to fair-usage limits.

## 10. Networks and coverage

Connectivity is delivered through third-party mobile networks. Coverage, speeds, and availability depend on those networks and local conditions, and may vary or be unavailable in some areas. We do not control and are not responsible for third-party network performance.

## 11. Intellectual property

The eSIM4U name, logo, website, and content are owned by us or our licensors and are protected by intellectual property laws. You may not copy, modify, or distribute them without our prior written permission.

## 12. Limitation of liability

To the maximum extent permitted by law, eSIM4U is not liable for indirect, incidental, or consequential losses, or for loss of data, profits, or connectivity arising from third-party networks. Our total liability for any claim is limited to the amount you paid for the plan giving rise to the claim.

## 13. Termination

We may suspend or terminate access to our services if you breach these Terms or use the services fraudulently or unlawfully. You may stop using the services at any time.

## 14. Changes to these terms

We may update these Terms from time to time. Material changes will be reflected by the "Last updated" date above, and continued use of the services after an update constitutes acceptance of the revised Terms.

## 15. Governing law

These Terms are governed by the laws of the United Kingdom, and the courts of the United Kingdom have non-exclusive jurisdiction over any dispute, without prejudice to any mandatory consumer-protection rights you may have in your country of residence.`;

export const DEFAULT_PRIVACY_MD = `This Privacy Policy explains what personal data eSIM4U collects, why we collect it, how we use and share it, and the choices and rights you have.

## 1. Who we are

eSIM4U provides eSIM data plans through our website. This policy applies to personal data we process when you visit our site, create an account, or purchase and use our plans. If you have questions, contact us at [support@esim4u.uk](mailto:support@esim4u.uk).

## 2. Information we collect

- **Account data:** name, email address, and profile details you provide.
- **Order and payment data:** the plans you buy and payment confirmation details. Card details are processed directly by our payment providers — we do not store full card numbers.
- **eSIM and usage data:** the eSIM assigned to you and associated data-usage and status information needed to run the service.
- **Support data:** messages you send us and information you include in tickets or contact forms.
- **Technical data:** limited device/browser information and cookies used to keep you signed in and secure the service.

## 3. How we use your information

- To create and manage your account and provide our services.
- To process payments, provision eSIMs, and deliver order confirmations.
- To provide customer support and respond to your enquiries.
- To operate the referral program and prevent fraud or abuse.
- To send service-related emails and, where permitted, occasional offers you can opt out of.

## 4. How we share information

We share personal data only as needed to run the service, with providers such as:

- **Connectivity partner** to provision and manage your eSIM.
- **Payment processors** (Stripe and PayPal) to take payments and issue refunds.
- **Email provider** to send transactional and support emails.
- **Hosting and infrastructure** providers that store data securely on our behalf.

We do not sell your personal data.

## 5. Cookies

We use essential cookies to keep you signed in and to protect the service. We may use limited analytics to understand and improve how the site is used. You can control cookies through your browser settings.

## 6. Data retention

We keep personal data for as long as your account is active and as needed to provide the service, comply with legal and tax obligations, resolve disputes, and enforce our agreements. When data is no longer needed, we delete or anonymise it.

## 7. Security

We use appropriate technical and organisational measures to protect your data, including encryption in transit and access controls. No method of transmission or storage is completely secure, but we work to protect your information and continually improve our safeguards.

## 8. Your rights

Depending on where you live, you may have the right to access, correct, delete, or export your personal data, to object to or restrict certain processing, and to withdraw consent. To exercise these rights, contact us at [support@esim4u.uk](mailto:support@esim4u.uk). You may also manage much of your information directly in your account settings.

## 9. International transfers

Because we work with global partners, your data may be processed in countries other than your own. Where it is, we take steps to ensure it remains protected in line with applicable law.

## 10. Children

Our services are not directed to children under 18, and we do not knowingly collect their personal data. If you believe a child has provided us information, please contact us so we can remove it.

## 11. Changes to this policy

We may update this policy from time to time. The "Last updated" date above reflects the latest version, and we encourage you to review it periodically.`;

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
    telegram: { url: "https://t.me/esim4u_uk_bot", enabled: true },
  },
  features: { topup: true, referrals: true, affiliate: true, blog: true, cookieConsent: true },
  maintenance: {
    website: false,
    bot: false,
    message: "We're doing some scheduled maintenance and will be back shortly. Thanks for your patience!",
    from: "",
    to: "",
  },
  legal: {
    updated: "September 2026",
    terms: DEFAULT_TERMS_MD,
    privacy: DEFAULT_PRIVACY_MD,
  },
};
