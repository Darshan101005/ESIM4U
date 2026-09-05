import type { Metadata } from "next";
import LegalLayout from "@/components/marketing/legal-layout";

export const metadata: Metadata = {
  title: "Cookie Policy | eSIM4U",
  description: "How eSIM4U uses cookies and similar technologies, and how you can control them.",
};

const h2 = "text-[20px] sm:text-[22px] font-bold text-[#1A1D20] tracking-tight mb-3";
const p = "mb-3";
const ul = "list-disc pl-5 space-y-2 mb-3";

export default function CookiePolicyPage() {
  return (
    <LegalLayout
      title="Cookie Policy"
      updated="September 2026"
      intro="This Cookie Policy explains what cookies are, how eSIM4U uses them, and the choices you have. It should be read alongside our Privacy Policy."
    >
      <section>
        <h2 className={h2}>1. What are cookies?</h2>
        <p className={p}>
          Cookies are small text files stored on your device when you visit a website. They help the site work, remember
          your preferences, keep you signed in, and understand how the site is used. Similar technologies such as local
          storage are treated the same way in this policy.
        </p>
      </section>

      <section>
        <h2 className={h2}>2. How we use cookies</h2>
        <ul className={ul}>
          <li><span className="font-semibold text-[#1A1D20]">Essential:</span> required to run the site, keep you signed in, secure your session, and remember your cookie choices. These cannot be switched off.</li>
          <li><span className="font-semibold text-[#1A1D20]">Analytics:</span> help us understand how visitors use the site so we can improve it. Optional.</li>
          <li><span className="font-semibold text-[#1A1D20]">Marketing:</span> used to measure and improve our offers and campaigns. Optional.</li>
        </ul>
      </section>

      <section>
        <h2 className={h2}>3. Managing your choices</h2>
        <p className={p}>
          When you first visit eSIM4U, a banner lets you <span className="font-semibold text-[#1A1D20]">Accept all</span>,{" "}
          <span className="font-semibold text-[#1A1D20]">Reject non-essential</span>, or <span className="font-semibold text-[#1A1D20]">Manage</span> optional
          categories individually. You can also control cookies through your browser settings, including deleting cookies
          already stored. Blocking essential cookies may stop parts of the site from working.
        </p>
      </section>

      <section>
        <h2 className={h2}>4. Third-party cookies</h2>
        <p className={p}>
          Some cookies may be set by trusted third parties we use to run the service, such as our payment processors and
          infrastructure providers. These are used only to deliver and secure the service.
        </p>
      </section>

      <section>
        <h2 className={h2}>5. Changes to this policy</h2>
        <p className={p}>
          We may update this Cookie Policy from time to time. The &quot;Last updated&quot; date above reflects the latest
          version.
        </p>
      </section>
    </LegalLayout>
  );
}
