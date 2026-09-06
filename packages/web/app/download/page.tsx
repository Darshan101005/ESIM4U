import type { Metadata } from "next";
import SiteHeader from "@/components/marketing/site-header";
import SiteFooter from "@/components/marketing/site-footer";
import { Download, ShieldCheck, Smartphone, Share, Plus, MoreVertical, QrCode, Send } from "lucide-react";

const TELEGRAM_BOT_URL = "https://t.me/esim4u_uk_bot";

export const metadata: Metadata = {
  title: "Download the ESIM4U App",
  description: "Install the ESIM4U app on Android (APK), or add it to your home screen on Android Chrome and iPhone Safari.",
};

const ANDROID_APK = "/api/download/android";

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="shrink-0 w-7 h-7 rounded-full bg-[#FFF4F0] text-[#FF561E] text-[13px] font-bold flex items-center justify-center">{n}</span>
      <span className="text-[14.5px] leading-[1.7] text-[#374151] pt-0.5">{children}</span>
    </li>
  );
}

function SectionHeading({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-11 h-11 rounded-xl bg-[#FFF4F0] flex items-center justify-center shrink-0">{icon}</div>
      <div>
        <h2 className="text-[19px] font-bold text-[#1A1D20] leading-tight">{title}</h2>
        <p className="text-[12.5px] text-[#6B7280]">{subtitle}</p>
      </div>
    </div>
  );
}

export default function DownloadPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      <main className="flex-1 w-full">
        <div className="w-full bg-gradient-to-b from-[#FFF4F0] to-white">
          <SiteHeader active="download" />
          <div className="max-w-[760px] mx-auto px-5 sm:px-8 pt-6 pb-10 sm:pt-10 text-center">
            <h1 className="text-[30px] sm:text-[44px] leading-[1.1] font-semibold text-[#1A1D20] tracking-[-0.02em]">
              Get the eSIM4U <span className="text-[#FF561E] font-serif italic font-normal">App</span>
            </h1>
            <p className="mt-4 text-[16px] leading-[1.7] text-[#5E6673] font-medium max-w-[560px] mx-auto">
              Follow the guide below for your device. Install our Android app, or add eSIM4U to your home screen on any phone.
            </p>
          </div>
        </div>

        {/* Single scrollable installation guide */}
        <div className="max-w-[760px] mx-auto px-5 sm:px-8 py-10 sm:py-12 flex flex-col gap-12">

          {/* 1. Android APK */}
          <section>
            <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#FFF4F0] flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5 text-[#FF561E]" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-[19px] font-bold text-[#1A1D20] leading-tight">Install the Android app</h2>
                  <p className="text-[12.5px] text-[#6B7280]">Direct install using the .apk file</p>
                </div>
              </div>
              <a
                href={ANDROID_APK}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#FF561E] text-white text-[15px] font-bold hover:bg-[#E04B18] transition-colors shadow-sm shadow-orange-500/20 shrink-0"
              >
                <Download className="w-5 h-5" /> Download APK
              </a>
            </div>

            <div className="flex flex-col items-center mb-8">
              <div className="w-72 h-72 sm:w-[340px] sm:h-[340px] rounded-2xl border border-gray-100 bg-white shadow-[0_2px_16px_rgba(0,0,0,0.05)] p-4 flex items-center justify-center overflow-hidden">
                {/* Add the QR image (encode https://esim4u.uk/api/download/android) at this path */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/app-qr.png" alt="Scan to download the eSIM4U app" className="w-full h-full object-contain" />
              </div>
              <p className="text-[13.5px] font-semibold text-[#1A1D20] mt-3 inline-flex items-center gap-2">
                <QrCode className="w-4 h-4 text-[#FF561E]" /> Scan with your phone to download
              </p>
            </div>

            <ol className="space-y-3.5">
              <Step n={1}>Tap <b>Download APK</b> above (or scan the QR code from another phone).</Step>
              <Step n={2}>When it finishes, open the downloaded file from your notifications or the <b>Files</b> app.</Step>
              <Step n={3}>If Android asks, tap <b>Settings</b> and turn on <b>Allow from this source</b>, then go back and continue.</Step>
              <Step n={4}>If <b>Google Play Protect</b> shows a warning, tap <b>Install anyway</b>.</Step>
              <Step n={5}>Tap <b>Install</b> — the eSIM4U app is added to your phone.</Step>
            </ol>

            <div className="mt-6 rounded-xl bg-amber-50 border border-amber-100 p-4">
              <p className="text-[13px] text-amber-700 leading-relaxed inline-flex gap-2.5">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <span>These prompts are completely normal for apps installed outside the Play Store. The app is safe and properly signed — just tap <b>Install anyway</b> to continue.</span>
              </p>
            </div>
          </section>

          <div className="border-t border-gray-100" />

          {/* 2. Android Chrome PWA */}
          <section>
            <SectionHeading
              icon={<MoreVertical className="w-5 h-5 text-[#FF561E]" strokeWidth={2} />}
              title="Install as PWA — Android (Chrome)"
              subtitle="No install needed — opens full-screen like an app"
            />

            <p className="text-[14.5px] text-[#6B7280] leading-relaxed mb-5">
              Prefer not to install the APK? You can add the website to your home screen instead.
            </p>

            <ol className="space-y-3.5">
              <Step n={1}>Open <b>esim4u.uk</b> in the <b>Chrome</b> browser.</Step>
              <Step n={2}>Tap the <b>⋮</b> menu in the top-right corner.</Step>
              <Step n={3}>Tap <b>Install app</b> (or <b>Add to Home screen</b>).</Step>
              <Step n={4}>Confirm — the eSIM4U icon appears on your home screen.</Step>
            </ol>

            <p className="text-[13px] text-[#6B7280] mt-5">Tip: an <b>Install app</b> banner may also pop up automatically at the bottom of the screen.</p>
          </section>

          <div className="border-t border-gray-100" />

          {/* 3. iOS Safari */}
          <section>
            <SectionHeading
              icon={<Share className="w-5 h-5 text-[#FF561E]" strokeWidth={2} />}
              title="Install as PWA — iPhone & iPad (Safari)"
              subtitle="Opens full-screen like a native app"
            />

            <p className="text-[14.5px] text-[#6B7280] leading-relaxed mb-5">
              On iPhone and iPad, add eSIM4U to your home screen from the Safari browser.
            </p>

            <ol className="space-y-3.5">
              <Step n={1}>Open <b>esim4u.uk</b> in <b>Safari</b> (this won&apos;t work in Chrome on iOS).</Step>
              <Step n={2}>Tap the <b>Share</b> icon <Share className="inline w-4 h-4 -mt-0.5" /> at the bottom of the screen.</Step>
              <Step n={3}>Scroll down and tap <b>Add to Home Screen</b> <Plus className="inline w-4 h-4 -mt-0.5" />.</Step>
              <Step n={4}>Tap <b>Add</b> in the top-right — the eSIM4U icon appears on your home screen.</Step>
            </ol>
          </section>

          <div className="border-t border-gray-100" />

          {/* 4. Telegram bot & Mini App */}
          <section>
            <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#EAF6FC] flex items-center justify-center shrink-0">
                  <Send className="w-5 h-5 text-[#229ED9]" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-[19px] font-bold text-[#1A1D20] leading-tight">Prefer Telegram? Use our bot</h2>
                  <p className="text-[12.5px] text-[#6B7280]">Manage eSIMs and buy plans right inside Telegram — no install needed</p>
                </div>
              </div>
              <a
                href={TELEGRAM_BOT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#229ED9] text-white text-[15px] font-bold hover:bg-[#1c8ec2] transition-colors shadow-sm shrink-0"
              >
                <Send className="w-5 h-5" /> Open Telegram bot
              </a>
            </div>

            <p className="text-[14.5px] text-[#6B7280] leading-relaxed mb-5">
              If you&apos;re on Telegram, you can do everything there too — browse and buy plans, view your eSIMs and QR
              codes, check your wallet and data usage, and chat with support. The built-in <b>Mini App</b> opens the full
              eSIM4U website right inside Telegram, so buying and logging in work exactly the same.
            </p>

            <ol className="space-y-3.5">
              <Step n={1}>Open our bot <b>@esim4u_uk_bot</b> — tap <b>Open Telegram bot</b> above, or search the name in Telegram.</Step>
              <Step n={2}>Tap <b>Start</b> to see the menu.</Step>
              <Step n={3}>Tap <b>🌐 Open App</b> to launch the eSIM4U <b>Mini App</b> inside Telegram and browse or buy plans.</Step>
              <Step n={4}>Tap <b>🔗 Link my account</b> to connect your eSIM4U account (one-time code, or email &amp; password) — then view your eSIMs, wallet, data usage and QR codes in chat.</Step>
              <Step n={5}>Tap <b>💬 Support</b> any time to chat with our team, and get your eSIM QR delivered to Telegram automatically after each purchase.</Step>
            </ol>

            <div className="mt-6 rounded-xl bg-[#EAF6FC] border border-[#229ED9]/15 p-4">
              <p className="text-[13px] text-[#0f6c96] leading-relaxed inline-flex gap-2.5">
                <Send className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Tip: the Mini App runs the same secure website — your login, payments and eSIMs are all in one account, whether you use the app, the website or Telegram.</span>
              </p>
            </div>
          </section>

        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
