import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import ToasterProvider from "@/components/toaster-provider";
import PwaRegister from "@/components/pwa-register";
import PwaInstallPrompt from "@/components/pwa-install-prompt";

export const metadata: Metadata = {
  title: "eSIM4U - Global eSIM Solutions",
  description: "Get instant eSIM connectivity worldwide with eSIM4U",
  applicationName: "ESIM4U",
  manifest: "/manifest.webmanifest",
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <ToasterProvider />
        <PwaRegister />
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
