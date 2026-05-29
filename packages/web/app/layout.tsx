import type { Metadata } from "next";
import "@/styles/globals.css";
import ToasterProvider from "@/components/toaster-provider";

export const metadata: Metadata = {
  title: "eSIM4U - Global eSIM Solutions",
  description: "Get instant eSIM connectivity worldwide with eSIM4U",
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
      </body>
    </html>
  );
}
