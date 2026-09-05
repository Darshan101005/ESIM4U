"use client";

import Image from "next/image";
import DashboardTopbar from "@/components/dashboard/topbar";
import ArticleLayout, { TocItem } from "@/components/dashboard/article-layout";
import { Check, Info } from "lucide-react";

const sections: TocItem[] = [
  { id: "support", label: "Which Android devices support eSIM?" },
  { id: "check", label: "How can I check if my Android device is eSIM-compatible?" },
  { id: "setup", label: "How to set up eSIM on Android" },
  { id: "remove", label: "How to remove eSIM from Android phone" },
];

const supportedDevices = [
  "Motorola Razr 2019",
  "Motorola Razr 5G",
  "Gemini PDA",
  "Rakuten Mini",
  "Rakuten BigS",
  "Rakuten Big",
  "Rakuten Hand",
  "Rakuten Hand 5G",
  "Surface Pro X",
  "Honor Magic 4 Pro",
  "Fairphone 4",
  "Sharp Aquos Sense 6s",
  "Sharp Aquos Wish",
  "DOOGEE V30",
  "Nuu Mobile X5",
];

function TickList({ steps }: { steps: string[] }) {
  return (
    <ul className="space-y-2.5">
      {steps.map((step, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <span className="w-[18px] h-[18px] rounded-full bg-[#FF561E] flex items-center justify-center shrink-0 mt-0.5">
            <Check className="w-3 h-3 text-white" strokeWidth={3} />
          </span>
          <span className="text-[14px] text-[#374151] leading-relaxed">{step}</span>
        </li>
      ))}
    </ul>
  );
}

function NumberedStep({ index, title, children }: { index: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4">
      <span className="w-7 h-7 rounded-full bg-[#FF561E] text-white text-[13px] font-bold flex items-center justify-center shrink-0">
        {index}
      </span>
      <div className="min-w-0">
        <p className="text-[15px] font-bold text-[#1A1D20]">{title}</p>
        {children && <p className="text-[14px] text-[#6B7280] leading-relaxed mt-1">{children}</p>}
      </div>
    </div>
  );
}

function ArticleImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] mt-5">
      <Image src={src} alt={alt} width={1536} height={1024} className="w-full h-auto" />
    </div>
  );
}

export default function AndroidGuidePage() {
  return (
    <>
      <DashboardTopbar title="Installation Guide" />
      <ArticleLayout
        backHref="/dashboard/support"
        backLabel="Back to Support"
        eyebrow="Installation Guide"
        title="eSIM Activation on Android"
        icon={<Image src="/assets/Installation/Andriod/Andriod.png" alt="Android" width={44} height={44} className="w-11 h-11 object-contain" />}
        sections={sections}
        intro="An eSIM, or an embedded SIM, is a great way to activate your wireless plan easily and quickly. eSIMs are completely virtual programmable cards that do exactly what physical SIM cards do: securely connect you with your network and provide access to your service so you can use your plan. The only difference is, you just don't have to insert them (or wait for them to be delivered). Instead, eSIMs can easily be installed onto your phone or device online or via an app. Read on to learn how to set up eSIM on Android devices."
      >
        <section id="support" className="scroll-mt-[96px]">
          <h2 className="text-[22px] font-bold text-[#1A1D20] tracking-tight mb-3">Which Android devices support eSIM?</h2>
          <p className="text-[14px] leading-[1.85] text-[#6B7280] mb-5">
            Many Android devices support eSIM. Most newer devices will be eSIM-compatible, since eSIMs are a newer
            technology, but check out our eSIM-supported phones list below:
          </p>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 mb-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              {supportedDevices.map((device) => (
                <div key={device} className="flex items-center gap-2.5">
                  <span className="w-[18px] h-[18px] rounded-full bg-[#FF561E] flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </span>
                  <span className="text-[14px] text-[#374151]">{device}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-[14px] leading-[1.85] text-[#6B7280]">
            Read on to find out how to see if your individual Android device is eSIM-compatible, if it isn’t already on
            this list.
          </p>
        </section>

        <section id="check" className="scroll-mt-[96px]">
          <h2 className="text-[22px] font-bold text-[#1A1D20] tracking-tight mb-3">
            How can I check if my Android device is eSIM-compatible?
          </h2>
          <p className="text-[14px] leading-[1.85] text-[#6B7280] mb-6">
            Want to know if your Android is eSIM-compatible? It’s easy. You can find out right in your phone’s settings.
            Here’s how depending on what kind of Android device you have:
          </p>
          <div className="space-y-5">
            <div className="rounded-2xl border border-gray-100 bg-white p-5">
              <h3 className="text-[15px] font-bold text-[#1A1D20] mb-3">On Samsung</h3>
              <TickList
                steps={[
                  "Go to Settings",
                  "Tap Connections",
                  "Tap SIM Card Manager",
                  "If Add eSIM is available, your Samsung supports eSIM",
                ]}
              />
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5">
              <h3 className="text-[15px] font-bold text-[#1A1D20] mb-3">On Google Pixel</h3>
              <TickList
                steps={[
                  "Go to Settings",
                  "Tap Network & Internet",
                  "Tap eSIM Cards",
                  "If Connect to a Mobile Network has a Download a SIM instead? option, your device is eSIM-compatible",
                ]}
              />
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5">
              <h3 className="text-[15px] font-bold text-[#1A1D20] mb-3">For other Android devices</h3>
              <TickList
                steps={[
                  "Go to Settings",
                  "Tap About Phone",
                  "Tap Show EID",
                  "If you see an EID number, your phone is eSIM-compatible",
                ]}
              />
            </div>
          </div>
        </section>

        <section id="setup" className="scroll-mt-[96px]">
          <h2 className="text-[22px] font-bold text-[#1A1D20] tracking-tight mb-3">How to set up eSIM on Android</h2>
          <p className="text-[14px] leading-[1.85] text-[#6B7280] mb-6">
            Now you know if your phone is compatible or not. Ready to get started with your new eSIM4U plan? Good thing
            setting up your eSIM is SIMple. First, make sure you have a compatible phone and a carrier that offers eSIM.
            Then make sure you’re also connected to Wi-Fi. Once that’s done, you’re ready to set up your eSIM. Here’s how:
          </p>
          <div className="space-y-5">
            <div className="rounded-2xl border border-gray-100 bg-white p-5">
              <div className="space-y-5">
                <NumberedStep index={1} title="Go to Settings">
                  Open the Settings app on your Android device.
                </NumberedStep>
                <NumberedStep index={2} title="Select Network & Internet or SIM manager">
                  Depending on your device, open Network & Internet or the SIM manager screen.
                </NumberedStep>
              </div>
              <ArticleImage src="/assets/Installation/Andriod/Andriod_Step1&2.png" alt="Android eSIM setup steps 1 and 2" />
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5">
              <div className="space-y-5">
                <NumberedStep index={3} title="Select + next to SIMS">
                  Tap the + icon next to SIMS to begin adding a new plan.
                </NumberedStep>
                <NumberedStep index={4} title="Select Download A SIM Instead option">
                  Choose the Download a SIM instead option rather than inserting a physical card.
                </NumberedStep>
              </div>
              <ArticleImage src="/assets/Installation/Andriod/Andriod_Step3&4.png" alt="Android eSIM setup steps 3 and 4" />
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5">
              <div className="space-y-5">
                <NumberedStep index={5} title="Select Next">
                  Tap Next to continue to the QR scanner.
                </NumberedStep>
                <NumberedStep index={6} title="Scan your QR code">
                  Point your camera at the eSIM QR code from your confirmation email to load the plan.
                </NumberedStep>
                <NumberedStep index={7} title="Select Done">
                  Confirm and tap Done. Your eSIM is now installed and ready to activate.
                </NumberedStep>
              </div>
              <ArticleImage src="/assets/Installation/Andriod/Andriod_Step5&6.png" alt="Android eSIM setup steps 5 and 6" />
            </div>
          </div>
        </section>

        <section id="remove" className="scroll-mt-[96px]">
          <h2 className="text-[22px] font-bold text-[#1A1D20] tracking-tight mb-3">How to remove eSIM from Android phone</h2>
          <p className="text-[14px] leading-[1.85] text-[#6B7280] mb-5">
            Now that you know how to add eSIM on Android, it’s time to learn how to remove it. Maybe you no longer need an
            eSIM or maybe you’re ready to switch back to a physical SIM card. Whatever the case, here’s how to remove an
            eSIM from your Android phone. Luckily, it’s as easy as installing one:
          </p>
          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <TickList
              steps={[
                "Go to Settings",
                "Tap Connections",
                "Tap SIM Manager",
                "Tap the eSIM you want to remove",
                "Tap Remove or Delete eSIM",
              ]}
            />
          </div>
          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[#FFF4F0] border border-orange-100 px-5 py-4">
            <Info className="w-5 h-5 text-[#FF561E] shrink-0 mt-0.5" strokeWidth={2} />
            <div>
              <p className="text-[13px] font-bold text-[#1A1D20]">Note</p>
              <p className="text-[13px] text-[#6B7280] leading-relaxed mt-0.5">
                Some eSIMs can only be installed once, so make absolutely sure you don’t need to use the eSIM again before
                deleting it from your device.
              </p>
            </div>
          </div>
        </section>
      </ArticleLayout>
    </>
  );
}
