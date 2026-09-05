"use client";

import { useState } from "react";
import SiteHeader from "@/components/marketing/site-header";
import SiteFooter from "@/components/marketing/site-footer";
import { Mail, MessageCircle, Send, CheckCircle2, Clock, Ticket } from "lucide-react";

const WHATSAPP_DISPLAY = "+92 323 9539487";
const WHATSAPP_LINK = "https://wa.me/923239539487";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setError(null);
    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
      } else {
        setDone(data.ref || "");
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const inputCls =
    "w-full px-4 py-3 rounded-xl bg-white border border-gray-200 outline-none focus:border-[#FF561E] focus:ring-1 focus:ring-[#FF561E]/20 text-[14px] transition-all";

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      <main className="flex-1 w-full">
        <div className="w-full bg-gradient-to-b from-[#FFF4F0] to-white">
          <SiteHeader />
          <div className="max-w-[1000px] mx-auto px-5 sm:px-8 pt-6 pb-8 sm:pt-10 text-center">
            <h1 className="text-[30px] sm:text-[44px] leading-[1.1] font-semibold text-[#1A1D20] tracking-[-0.02em]">
              Get in <span className="text-[#FF561E] font-serif italic font-normal">touch</span>
            </h1>
            <p className="mt-4 text-[16px] leading-[1.7] text-[#5E6673] font-medium max-w-[560px] mx-auto">
              Have a question about eSIMs, an order, or your account? Reach us on WhatsApp, by email, or send a message
              below and we&apos;ll reply to your inbox.
            </p>
          </div>
        </div>

        <div className="max-w-[1000px] mx-auto px-5 sm:px-8 py-10 sm:py-14 grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-8">
          {/* Channels */}
          <div className="flex flex-col gap-4">
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 hover:border-emerald-200 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
                <MessageCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-[15px] font-bold text-[#1A1D20]">WhatsApp</p>
                <p className="text-[13px] text-[#6B7280]">{WHATSAPP_DISPLAY}</p>
              </div>
            </a>

            <a href="mailto:support@esim4u.uk" className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 hover:border-orange-200 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF4F0] flex items-center justify-center shrink-0">
                <Mail className="w-6 h-6 text-[#FF561E]" />
              </div>
              <div>
                <p className="text-[15px] font-bold text-[#1A1D20]">Email</p>
                <p className="text-[13px] text-[#6B7280]">support@esim4u.uk</p>
              </div>
            </a>

            <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF4F0] flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 text-[#FF561E]" />
              </div>
              <div>
                <p className="text-[15px] font-bold text-[#1A1D20]">Response time</p>
                <p className="text-[13px] text-[#6B7280]">Usually within a few hours.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-orange-100 bg-[#FFF4F0] p-5">
              <div className="flex items-center gap-2 mb-1.5">
                <Ticket className="w-4 h-4 text-[#FF561E]" />
                <p className="text-[14px] font-bold text-[#1A1D20]">Already have an account?</p>
              </div>
              <p className="text-[13px] text-[#6B7280] leading-relaxed">
                Sign in and open a support ticket or live chat from your dashboard for faster, order-aware help.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 sm:p-8">
            {done !== null ? (
              <div className="flex flex-col items-center text-center py-8">
                <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-[20px] font-bold text-[#1A1D20] mb-2">Message sent</h2>
                <p className="text-[14px] text-[#6B7280] max-w-[360px]">
                  Thanks for reaching out. We&apos;ve received your message{done ? <> (ref <span className="font-semibold text-[#1A1D20]">{done}</span>)</> : null} and will reply to your email shortly.
                </p>
                <button onClick={() => setDone(null)} className="mt-6 px-6 py-3 rounded-full border border-[#FF561E] text-[#FF561E] font-semibold text-[14px] hover:bg-[#FF561E] hover:text-white transition-colors">
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="flex flex-col gap-4">
                <h2 className="text-[20px] font-bold text-[#1A1D20]">Send us a message</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Your name</label>
                    <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" required />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Email address</label>
                    <input type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Subject <span className="text-gray-400">(optional)</span></label>
                  <input className={inputCls} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What's this about?" />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Message</label>
                  <textarea className={`${inputCls} min-h-[140px] resize-y`} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="How can we help?" required />
                </div>
                {error && <p className="text-[13px] text-red-600 font-medium">{error}</p>}
                <button type="submit" disabled={sending} className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#FF561E] text-white font-semibold text-[15px] shadow-lg shadow-orange-500/20 hover:scale-[1.01] transition-transform disabled:opacity-70">
                  {sending ? "Sending…" : "Send message"}
                  {!sending && <Send className="w-4 h-4" />}
                </button>
                <p className="text-[12px] text-[#9CA3AF] text-center">
                  By sending this you agree to our{" "}
                  <a href="/privacy" className="text-[#FF561E] underline underline-offset-2">Privacy Policy</a>.
                </p>
              </form>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
