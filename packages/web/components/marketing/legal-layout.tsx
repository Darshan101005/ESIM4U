import SiteHeader from "@/components/marketing/site-header";
import SiteFooter from "@/components/marketing/site-footer";

/**
 * Shared layout for long-form content pages (Terms, Privacy, Refund, etc.).
 * Renders the marketing header, a titled hero, a readable prose column, and
 * the shared footer.
 */
export default function LegalLayout({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated?: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      <div className="w-full bg-gradient-to-b from-[#FFF4F0] to-white">
        <SiteHeader />
        <div className="max-w-[820px] mx-auto px-5 sm:px-8 pt-6 pb-10 sm:pt-8 sm:pb-12">
          <h1 className="text-[30px] sm:text-[44px] leading-[1.1] font-semibold text-[#1A1D20] tracking-[-0.02em]">
            {title}
          </h1>
          {updated && (
            <p className="mt-3 text-[13px] font-medium text-[#6B7280]">Last updated: {updated}</p>
          )}
          {intro && (
            <p className="mt-5 text-[15px] sm:text-[16px] leading-[1.7] text-[#5E6673] font-medium">{intro}</p>
          )}
        </div>
      </div>

      <main className="flex-1 w-full">
        <div className="max-w-[820px] mx-auto px-5 sm:px-8 py-10 sm:py-14">
          <div className="legal-prose text-[15px] leading-[1.8] text-[#374151] space-y-8">
            {children}
          </div>

          <div className="mt-14 rounded-2xl border border-orange-100 bg-[#FFF4F0] px-6 py-6">
            <p className="text-[15px] font-bold text-[#1A1D20] mb-1">Questions?</p>
            <p className="text-[14px] text-[#6B7280] leading-relaxed">
              If anything here is unclear, contact us at{" "}
              <a href="mailto:support@esim4u.uk" className="text-[#FF561E] font-semibold underline underline-offset-2">
                support@esim4u.uk
              </a>{" "}
              or through our{" "}
              <a href="/contact" className="text-[#FF561E] font-semibold underline underline-offset-2">
                contact page
              </a>
              .
            </p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
