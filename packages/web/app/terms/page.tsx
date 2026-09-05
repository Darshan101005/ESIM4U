import type { Metadata } from "next";
import LegalLayout from "@/components/marketing/legal-layout";

export const metadata: Metadata = {
  title: "Terms of Service | eSIM4U",
  description:
    "The terms and conditions that govern your use of eSIM4U's website, eSIM data plans, and related services.",
};

const h2 = "text-[20px] sm:text-[22px] font-bold text-[#1A1D20] tracking-tight mb-3";
const p = "mb-3";
const ul = "list-disc pl-5 space-y-2 mb-3";

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      updated="September 2026"
      intro="These Terms of Service govern your access to and use of the eSIM4U website, mobile experience, and eSIM data plans. By creating an account or purchasing a plan, you agree to these terms."
    >
      <section>
        <h2 className={h2}>1. About these terms</h2>
        <p className={p}>
          eSIM4U (&quot;eSIM4U&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) provides embedded SIM (eSIM) data
          plans that let you connect to mobile networks in supported countries and regions. These Terms form a binding
          agreement between you and eSIM4U. If you do not agree with them, please do not use our services.
        </p>
      </section>

      <section>
        <h2 className={h2}>2. Eligibility and your account</h2>
        <p className={p}>
          You must be at least 18 years old, or the age of majority in your jurisdiction, to purchase a plan. You are
          responsible for keeping your account credentials secure and for all activity that occurs under your account.
          Please provide accurate information and keep it up to date.
        </p>
      </section>

      <section>
        <h2 className={h2}>3. eSIM plans, activation and validity</h2>
        <ul className={ul}>
          <li>Each plan specifies a data allowance, coverage area, and validity period.</li>
          <li>
            Unless stated otherwise, a plan&apos;s validity period begins when the eSIM first connects to a supported
            network in the destination — not when it is purchased or installed.
          </li>
          <li>Data allowances are for the stated validity window and do not roll over after expiry.</li>
          <li>Some eSIMs can only be installed once. Please install carefully and keep your QR code.</li>
        </ul>
      </section>

      <section>
        <h2 className={h2}>4. Device compatibility</h2>
        <p className={p}>
          Our plans require an eSIM-compatible, carrier-unlocked device. It is your responsibility to confirm your
          device supports eSIM before purchasing. We provide installation guides for iOS and Android, but we cannot
          guarantee compatibility with every device or carrier lock status.
        </p>
      </section>

      <section>
        <h2 className={h2}>5. Pricing, payment and taxes</h2>
        <p className={p}>
          Prices are shown in your selected display currency and are charged through our payment processors (Stripe and
          PayPal). You authorise us to charge your chosen payment method for the total shown at checkout, including any
          applicable taxes. We may update pricing at any time, but changes do not affect plans already purchased.
        </p>
      </section>

      <section>
        <h2 className={h2}>6. Refunds</h2>
        <p className={p}>
          Refunds are governed by our{" "}
          <a href="/refund-policy" className="text-[#FF561E] font-semibold underline underline-offset-2">
            Refund Policy
          </a>
          , including our money-back guarantee for eligible cases and automatic refunds where an eSIM fails to be
          provisioned after payment.
        </p>
      </section>

      <section>
        <h2 className={h2}>7. Referral and rewards program</h2>
        <p className={p}>
          Our referral program lets you and a friend each earn account credit when they complete their first eligible
          purchase using your referral code. Credits have no cash value, cannot be transferred, and may be subject to
          minimum-purchase or other conditions. We may modify or end the program, or withdraw credits obtained through
          fraud or abuse, at any time.
        </p>
      </section>

      <section>
        <h2 className={h2}>8. Acceptable use and included VPN</h2>
        <p className={p}>
          You agree to use our services lawfully and not to resell, tamper with, or use them to send spam, infringe
          rights, or breach any applicable law or the policies of the underlying networks. Where a plan includes VPN
          access, it is provided to help you reach services that may be restricted in certain regions and is subject to
          fair-usage limits.
        </p>
      </section>

      <section>
        <h2 className={h2}>9. Networks and coverage</h2>
        <p className={p}>
          Connectivity is delivered through third-party mobile networks. Coverage, speeds, and availability depend on
          those networks and local conditions, and may vary or be unavailable in some areas. We do not control and are
          not responsible for third-party network performance.
        </p>
      </section>

      <section>
        <h2 className={h2}>10. Intellectual property</h2>
        <p className={p}>
          The eSIM4U name, logo, website, and content are owned by us or our licensors and are protected by intellectual
          property laws. You may not copy, modify, or distribute them without our prior written permission.
        </p>
      </section>

      <section>
        <h2 className={h2}>11. Limitation of liability</h2>
        <p className={p}>
          To the maximum extent permitted by law, eSIM4U is not liable for indirect, incidental, or consequential
          losses, or for loss of data, profits, or connectivity arising from third-party networks. Our total liability
          for any claim is limited to the amount you paid for the plan giving rise to the claim.
        </p>
      </section>

      <section>
        <h2 className={h2}>12. Termination</h2>
        <p className={p}>
          We may suspend or terminate access to our services if you breach these Terms or use the services fraudulently
          or unlawfully. You may stop using the services at any time.
        </p>
      </section>

      <section>
        <h2 className={h2}>13. Changes to these terms</h2>
        <p className={p}>
          We may update these Terms from time to time. Material changes will be reflected by the &quot;Last updated&quot;
          date above, and continued use of the services after an update constitutes acceptance of the revised Terms.
        </p>
      </section>

      <section>
        <h2 className={h2}>14. Governing law</h2>
        <p className={p}>
          These Terms are governed by the laws of the United Kingdom, and the courts of the United Kingdom have
          non-exclusive jurisdiction over any dispute, without prejudice to any mandatory consumer-protection rights you
          may have in your country of residence.
        </p>
      </section>
    </LegalLayout>
  );
}
