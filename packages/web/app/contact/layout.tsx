import type { Metadata } from "next";

// The contact page itself is a client component (it has a form with local
// state), so it can't export metadata directly. This route-level layout
// supplies the page title, description and a self-referencing canonical so the
// page is indexed on its own URL instead of being flagged as a duplicate.
export const metadata: Metadata = {
  title: "Contact Us | eSIM4U",
  description:
    "Get in touch with the eSIM4U team. Send us a message about plans, activation, billing, or support and we'll reply to your inbox.",
  alternates: { canonical: "/contact" },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
