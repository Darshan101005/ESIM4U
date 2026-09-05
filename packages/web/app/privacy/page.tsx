import type { Metadata } from "next";
import LegalLayout from "@/components/marketing/legal-layout";

export const metadata: Metadata = {
  title: "Privacy Policy | eSIM4U",
  description:
    "How eSIM4U collects, uses, shares, and protects your personal data, and the rights you have over it.",
};

const h2 = "text-[20px] sm:text-[22px] font-bold text-[#1A1D20] tracking-tight mb-3";
const p = "mb-3";
const ul = "list-disc pl-5 space-y-2 mb-3";

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      updated="September 2026"
      intro="This Privacy Policy explains what personal data eSIM4U collects, why we collect it, how we use and share it, and the choices and rights you have."
    >
      <section>
        <h2 className={h2}>1. Who we are</h2>
        <p className={p}>
          eSIM4U provides eSIM data plans through our website. This policy applies to personal data we process when you
          visit our site, create an account, or purchase and use our plans. If you have questions, contact us at{" "}
          <a href="mailto:support@esim4u.uk" className="text-[#FF561E] font-semibold underline underline-offset-2">
            support@esim4u.uk
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className={h2}>2. Information we collect</h2>
        <ul className={ul}>
          <li><span className="font-semibold text-[#1A1D20]">Account data:</span> name, email address, and profile details you provide.</li>
          <li><span className="font-semibold text-[#1A1D20]">Order and payment data:</span> the plans you buy and payment confirmation details. Card details are processed directly by our payment providers — we do not store full card numbers.</li>
          <li><span className="font-semibold text-[#1A1D20]">eSIM and usage data:</span> the eSIM assigned to you and associated data-usage and status information needed to run the service.</li>
          <li><span className="font-semibold text-[#1A1D20]">Support data:</span> messages you send us and information you include in tickets or contact forms.</li>
          <li><span className="font-semibold text-[#1A1D20]">Technical data:</span> limited device/browser information and cookies used to keep you signed in and secure the service.</li>
        </ul>
      </section>

      <section>
        <h2 className={h2}>3. How we use your information</h2>
        <ul className={ul}>
          <li>To create and manage your account and provide our services.</li>
          <li>To process payments, provision eSIMs, and deliver order confirmations.</li>
          <li>To provide customer support and respond to your enquiries.</li>
          <li>To operate the referral program and prevent fraud or abuse.</li>
          <li>To send service-related emails and, where permitted, occasional offers you can opt out of.</li>
        </ul>
      </section>

      <section>
        <h2 className={h2}>4. How we share information</h2>
        <p className={p}>We share personal data only as needed to run the service, with providers such as:</p>
        <ul className={ul}>
          <li><span className="font-semibold text-[#1A1D20]">Connectivity partner</span> to provision and manage your eSIM.</li>
          <li><span className="font-semibold text-[#1A1D20]">Payment processors</span> (Stripe and PayPal) to take payments and issue refunds.</li>
          <li><span className="font-semibold text-[#1A1D20]">Email provider</span> to send transactional and support emails.</li>
          <li><span className="font-semibold text-[#1A1D20]">Hosting and infrastructure</span> providers that store data securely on our behalf.</li>
        </ul>
        <p className={p}>We do not sell your personal data.</p>
      </section>

      <section>
        <h2 className={h2}>5. Cookies</h2>
        <p className={p}>
          We use essential cookies to keep you signed in and to protect the service. We may use limited analytics to
          understand and improve how the site is used. You can control cookies through your browser settings.
        </p>
      </section>

      <section>
        <h2 className={h2}>6. Data retention</h2>
        <p className={p}>
          We keep personal data for as long as your account is active and as needed to provide the service, comply with
          legal and tax obligations, resolve disputes, and enforce our agreements. When data is no longer needed, we
          delete or anonymise it.
        </p>
      </section>

      <section>
        <h2 className={h2}>7. Security</h2>
        <p className={p}>
          We use appropriate technical and organisational measures to protect your data, including encryption in transit
          and access controls. No method of transmission or storage is completely secure, but we work to protect your
          information and continually improve our safeguards.
        </p>
      </section>

      <section>
        <h2 className={h2}>8. Your rights</h2>
        <p className={p}>
          Depending on where you live, you may have the right to access, correct, delete, or export your personal data,
          to object to or restrict certain processing, and to withdraw consent. To exercise these rights, contact us at{" "}
          <a href="mailto:support@esim4u.uk" className="text-[#FF561E] font-semibold underline underline-offset-2">
            support@esim4u.uk
          </a>
          . You may also manage much of your information directly in your account settings.
        </p>
      </section>

      <section>
        <h2 className={h2}>9. International transfers</h2>
        <p className={p}>
          Because we work with global partners, your data may be processed in countries other than your own. Where it
          is, we take steps to ensure it remains protected in line with applicable law.
        </p>
      </section>

      <section>
        <h2 className={h2}>10. Children</h2>
        <p className={p}>
          Our services are not directed to children under 18, and we do not knowingly collect their personal data. If
          you believe a child has provided us information, please contact us so we can remove it.
        </p>
      </section>

      <section>
        <h2 className={h2}>11. Changes to this policy</h2>
        <p className={p}>
          We may update this policy from time to time. The &quot;Last updated&quot; date above reflects the latest
          version, and we encourage you to review it periodically.
        </p>
      </section>
    </LegalLayout>
  );
}
