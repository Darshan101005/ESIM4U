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
    icon: "/icons/icon-192.png",
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
