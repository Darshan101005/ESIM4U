"use client";

import Image from "next/image";
import DashboardTopbar from "@/components/dashboard/topbar";
import ArticleLayout, { TocItem } from "@/components/dashboard/article-layout";
import { Info } from "lucide-react";

const sections: TocItem[] = [
  { id: "qr", label: "Install Using QR Code" },
  { id: "manual", label: "Manual Installation" },
  { id: "done", label: "You're all set" },
];

function NumberedStep({ index, title, children }: { index: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4">
      <span className="w-7 h-7 rounded-full bg-[#FF561E] text-white text-[13px] font-bold flex items-center justify-center shrink-0">
        {index}
      </span>
      <div className="min-w-0">
        <p className="text-[15px] font-bold text-[#1A1D20]">{title}</p>
        <p className="text-[14px] text-[#6B7280] leading-relaxed mt-1">{children}</p>
      </div>
    </div>
  );
}

function ArticleImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] my-6">
      <Image src={src} alt={alt} width={1536} height={1024} className="w-full h-auto" />
    </div>
  );
}

export default function IosGuidePage() {
  return (
    <>
      <DashboardTopbar title="Installation Guide" />
      <ArticleLayout
        backHref="/dashboard/support"
        backLabel="Back to Support"
        eyebrow="Installation Guide"
        title="eSIM Activation on iOS"
        icon={<Image src="/assets/Installation/Ios/Apple.svg" alt="Apple" width={32} height={32} className="w-8 h-8 object-contain" />}
        sections={sections}
        intro="Setting up your eSIM on an iPhone takes just a couple of minutes. You can either scan the QR code we send you or enter the activation details manually. Make sure your iPhone is connected to Wi-Fi before you begin, then follow the method that works best for you."
      >
        <section id="qr" className="scroll-mt-[96px]">
          <h2 className="text-[22px] font-bold text-[#1A1D20] tracking-tight mb-5">Install Using QR Code</h2>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 mb-5">
            <h3 className="text-[15px] font-bold text-[#1A1D20] mb-2">Method 1: Scan the QR code with your iPhone camera</h3>
            <p className="text-[14px] text-[#6B7280] leading-relaxed">
              Open your iPhone camera and point it at the eSIM QR code from your confirmation email. Tap the cellular
              plan notification that appears, then follow the on-screen prompts to add your plan.
            </p>
            <ArticleImage src="/assets/Installation/Ios/Camera_Scan.png" alt="Scan eSIM QR code with iPhone camera" />
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <h3 className="text-[15px] font-bold text-[#1A1D20] mb-4">Method 2: Scan and add in the settings page</h3>
            <div className="space-y-5">
              <NumberedStep index={1} title="Open Phone Settings">
                Tap Settings &gt; Cellular or Mobile Data &gt; Add eSIM or Add Cellular Plan or Add Mobile Data Plan &gt; Use
                QR Code.
              </NumberedStep>
              <NumberedStep index={2} title="Scan QR code">
                Use your phone’s camera to scan the eSIM QR code received via email.
              </NumberedStep>
            </div>
            <ArticleImage src="/assets/Installation/Ios/QR_Installation.png" alt="Add eSIM using QR code in iPhone settings" />
          </div>
        </section>

        <section id="manual" className="scroll-mt-[96px]">
          <h2 className="text-[22px] font-bold text-[#1A1D20] tracking-tight mb-5">Manual Installation</h2>
          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <div className="space-y-5">
              <NumberedStep index={1} title="Check email from eSIM4U">
                Find the email from support@esim4u.uk that contains your eSIM information.
              </NumberedStep>
              <NumberedStep index={2} title="Open Phone Settings">
                Tap Settings &gt; Cellular or Mobile Data &gt; Add eSIM or Add Cellular Plan or Add Mobile Data Plan &gt; Use
                QR Code &gt; Enter Details Manually.
              </NumberedStep>
              <NumberedStep index={3} title="Enter Activation Code">
                Enter the corresponding &quot;SM-DP+ Address&quot; and &quot;Activation Code&quot;. Please be careful not to
                include unnecessary characters like spaces.
              </NumberedStep>
            </div>
            <ArticleImage src="/assets/Installation/Ios/Manual_Installation.png" alt="Manually enter eSIM activation details on iPhone" />
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[#FFF4F0] border border-orange-100 px-5 py-4">
            <Info className="w-5 h-5 text-[#FF561E] shrink-0 mt-0.5" strokeWidth={2} />
            <div>
              <p className="text-[13px] font-bold text-[#1A1D20]">Note</p>
              <p className="text-[13px] text-[#6B7280] leading-relaxed mt-0.5">
                Your plan activates and the validity countdown begins only when your iPhone first connects to a supported
                network at your destination. Install on Wi-Fi before you travel.
              </p>
            </div>
          </div>
        </section>

        <section id="done" className="scroll-mt-[96px]">
          <h2 className="text-[22px] font-bold text-[#1A1D20] tracking-tight mb-3">You’re all set</h2>
          <p className="text-[14px] leading-[1.85] text-[#6B7280]">
            Once your eSIM is installed, label it (for example, Travel) and turn on Data Roaming for it when you arrive.
            That’s all it takes to stay connected. If you need a hand, our support team is always happy to help.
          </p>
        </section>
      </ArticleLayout>
    </>
  );
}
