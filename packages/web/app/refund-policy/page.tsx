import type { Metadata } from "next";
import LegalLayout from "@/components/marketing/legal-layout";

export const metadata: Metadata = {
  title: "Refund Policy | eSIM4U",
  description:
    "eSIM4U's refund policy, including our money-back guarantee, eligibility, non-refundable cases, and how to request a refund.",
};

const h2 = "text-[20px] sm:text-[22px] font-bold text-[#1A1D20] tracking-tight mb-3";
const p = "mb-3";
const ul = "list-disc pl-5 space-y-2 mb-3";

export default function RefundPolicyPage() {
  return (
    <LegalLayout
      title="Refund Policy"
      updated="September 2026"
      intro="We want you to buy with confidence. This policy explains when you can get a refund, what isn't eligible, and how to request one."
    >
      <section>
        <h2 className={h2}>1. Our money-back guarantee</h2>
        <p className={p}>
          If you experience a genuine technical issue that prevents your eSIM from working and our support team cannot
          resolve it, you may request a refund within 30 days of purchase. We&apos;ll always try to fix the problem
          first — most issues are quick to solve.
        </p>
      </section>

      <section>
        <h2 className={h2}>2. Eligible for a refund</h2>
        <ul className={ul}>
          <li>The eSIM was never delivered or failed to be provisioned after payment.</li>
          <li>The eSIM cannot be installed or activated due to a technical fault on our side, and support cannot resolve it.</li>
          <li>You were charged incorrectly or more than once for the same order.</li>
          <li>The plan has not been used (no data consumed) and has not been activated.</li>
        </ul>
      </section>

      <section>
        <h2 className={h2}>3. Not eligible for a refund</h2>
        <ul className={ul}>
          <li>The plan has been activated and/or data has been consumed.</li>
          <li>Your device is not eSIM-compatible or is carrier-locked (please check before buying).</li>
          <li>Issues caused by incorrect installation after guidance was provided, or by local network conditions outside our control.</li>
          <li>Change of mind after a plan has started, or the validity period has expired.</li>
        </ul>
      </section>

      <section>
        <h2 className={h2}>4. Automatic refunds for failed provisioning</h2>
        <p className={p}>
          If your payment succeeds but an eSIM cannot be assigned to your order, our system automatically refunds that
          item back to your original payment method. You do not need to do anything — you&apos;ll see the reversal on
          your statement within the processor&apos;s normal timeframe.
        </p>
      </section>

      <section>
        <h2 className={h2}>5. How to request a refund</h2>
        <p className={p}>
          Contact us at{" "}
          <a href="mailto:support@esim4u.uk" className="text-[#FF561E] font-semibold underline underline-offset-2">
            support@esim4u.uk
          </a>{" "}
          or through our{" "}
          <a href="/contact" className="text-[#FF561E] font-semibold underline underline-offset-2">
            contact page
          </a>{" "}
          with your order reference and a short description of the issue. Our team will review your request and respond
          promptly.
        </p>
      </section>

      <section>
        <h2 className={h2}>6. How refunds are processed</h2>
        <p className={p}>
          Approved refunds are returned to your original payment method (card via Stripe, or your PayPal account).
          Depending on your bank or provider, it can take a few business days for the funds to appear. Where you paid
          using account credit or wallet balance, the refund is returned to your eSIM4U wallet.
        </p>
      </section>

      <section>
        <h2 className={h2}>7. Referral and promotional credit</h2>
        <p className={p}>
          Account credit earned through referrals or promotions has no cash value and is not refundable to a payment
          method. If a refund includes an amount originally paid with credit, that portion is returned to your wallet.
        </p>
      </section>
    </LegalLayout>
  );
}
