import type { Metadata } from "next";
import LegalLayout from "@/components/marketing/legal-layout";
import MarkdownContent from "@/components/markdown-content";
import { getSiteSettings } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "Terms of Service | eSIM4U",
  description:
    "The terms and conditions that govern your use of eSIM4U's website, eSIM data plans, and related services.",
};

// Reflect admin edits from Manage Website without a rebuild.
export const dynamic = "force-dynamic";

export default async function TermsPage() {
  const settings = await getSiteSettings();
  return (
    <LegalLayout title="Terms of Service" updated={settings.legal.updated}>
      <MarkdownContent content={settings.legal.terms} />
    </LegalLayout>
  );
}
