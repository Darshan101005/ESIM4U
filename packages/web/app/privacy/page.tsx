import type { Metadata } from "next";
import LegalLayout from "@/components/marketing/legal-layout";
import MarkdownContent from "@/components/markdown-content";
import { getSiteSettings } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "Privacy Policy | eSIM4U",
  description:
    "How eSIM4U collects, uses, shares, and protects your personal data, and the rights you have over it.",
};

// Reflect admin edits from Manage Website without a rebuild.
export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  const settings = await getSiteSettings();
  return (
    <LegalLayout title="Privacy Policy" updated={settings.legal.updated}>
      <MarkdownContent content={settings.legal.privacy} />
    </LegalLayout>
  );
}
