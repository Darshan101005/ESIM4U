import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import ToasterProvider from "@/components/toaster-provider";
import PwaRegister from "@/components/pwa-register";
import PwaInstallPrompt from "@/components/pwa-install-prompt";
import MaintenanceGate from "@/components/maintenance-gate";
import AiChatWidget from "@/components/chat/ai-chat-widget";
import { getSiteSettingsCached } from "@/lib/site-settings";

export const metadata: Metadata = {
  metadataBase: new URL("https://esim4u.uk"),
  title: "eSIM4U — Global Travel eSIMs for 190+ Countries",
  description:
    "Buy travel eSIMs for 190+ countries. Instant delivery, no roaming fees — stay connected the moment you land with eSIM4U.",
  applicationName: "ESIM4U",
  keywords: [
    "eSIM",
    "eSIM4U",
    "eSIM4U UK",
    "UK eSIM",
    "eSIM UK",
    "buy eSIM UK",
    "best eSIM UK",
    "travel eSIM",
    "travel eSIM UK",
    "international eSIM",
    "global eSIM",
    "prepaid eSIM",
    "cheap eSIM",
    "eSIM data plan",
    "eSIM for travel",
    "international data plan",
    "roaming",
    "no roaming fees",
    "mobile data abroad",
    "tourist eSIM",
    "eSIM 190 countries",
  ],
  manifest: "/manifest.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: "eSIM4U",
    url: "https://esim4u.uk",
    locale: "en_GB",
    title: "eSIM4U — Global Travel eSIMs for 190+ Countries",
    description:
      "Buy travel eSIMs for 190+ countries. Instant delivery, no roaming fees — stay connected the moment you land.",
    images: [{ url: "/assets/esim4u-logo.png", width: 512, height: 512, alt: "eSIM4U" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "eSIM4U — Global Travel eSIMs for 190+ Countries",
    description:
      "Buy travel eSIMs for 190+ countries. Instant delivery, no roaming fees — stay connected the moment you land.",
    images: ["/assets/esim4u-logo.png"],
  },
  // For Search Console "URL prefix" verification via meta tag (optional):
  // set NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION in the environment.
  verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION },
  appleWebApp: {
    capable: true,
    title: "ESIM4U",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png", sizes: "64x64" },
    ],
    shortcut: "/favicon.ico",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#FF561E",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSiteSettingsCached();
  // Verified public social profiles strengthen the Organization entity (helps
  // Google connect the brand across the web).
  const sameAs = Object.values(settings.socials || {})
    .filter((s) => s?.enabled && s.url?.trim())
    .map((s) => s.url.trim());
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "eSIM4U",
      url: "https://esim4u.uk",
      logo: "https://esim4u.uk/assets/logo.png",
      description: "Instant travel eSIMs for 190+ countries.",
      areaServed: "Worldwide",
      ...(sameAs.length ? { sameAs } : {}),
      contactPoint: {
        "@type": "ContactPoint",
        email: settings.contactEmail || "support@esim4u.uk",
        contactType: "customer support",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "eSIM4U",
      url: "https://esim4u.uk",
      inLanguage: "en-GB",
    },
  ];

  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <AiChatWidget />
        <MaintenanceGate maintenance={settings.maintenance} />
        <ToasterProvider />
        <PwaRegister />
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
