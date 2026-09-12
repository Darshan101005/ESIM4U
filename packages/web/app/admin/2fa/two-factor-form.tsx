"use client";

// Client OTP entry for the admin 2FA login step (rendered by ./page.tsx).
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, ShieldCheck, Info, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

export default function TwoFactorForm() {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const code = digits.join("");

  const submit = async (value?: string) => {
    const otp = (value ?? code).trim();
    if (otp.length !== 6) {
      toast.error("Enter the 6-digit code");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/2fa/login-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      toast.success("Welcome back");
      router.push("/admin/dashboard");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
      setDigits(["", "", "", "", "", ""]);
      refs.current[0]?.focus();
      setLoading(false);
    }
  };

  const setAt = (i: number, v: string) => {
    const clean = v.replace(/\D/g, "");
    if (!clean) {
      setDigits((d) => d.map((x, idx) => (idx === i ? "" : x)));
      return;
    }
    const next = [...digits];
    // Support pasting the whole code into one box.
    if (clean.length > 1) {
      for (let k = 0; k < 6; k++) next[k] = clean[k] || "";
      setDigits(next);
      const filled = Math.min(clean.length, 6);
      refs.current[Math.min(filled, 5)]?.focus();
      if (filled === 6) submit(next.join(""));
      return;
    }
    next[i] = clean;
    setDigits(next);
    if (i < 5) refs.current[i + 1]?.focus();
    if (i === 5 && next.every((x) => x)) submit(next.join(""));
  };

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Image src="/assets/esim4u-logo.png" alt="eSIM4U" width={140} height={42} className="object-contain mb-4" priority />
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFF4F0] text-[#FF561E] text-[12px] font-bold">
            <ShieldCheck className="w-4 h-4" /> Two-Factor Authentication
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_8px_40px_rgba(0,0,0,0.06)] p-8">
          <h1 className="text-[22px] font-bold text-[#1A1D20] mb-1">Enter your code</h1>
          <p className="text-[14px] text-[#6B7280] mb-6">
            Open your authenticator app and enter the current 6-digit code for eSIM4U Admin.
          </p>

          <div className="flex items-center gap-1.5 sm:gap-2 mb-6" onPaste={(e) => setAt(0, e.clipboardData.getData("text"))}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => setAt(i, e.target.value)}
                onKeyDown={(e) => onKeyDown(i, e)}
                disabled={loading}
                className="flex-1 min-w-0 h-14 text-center text-[20px] sm:text-[22px] font-bold rounded-xl bg-white border border-gray-200 outline-none focus:border-[#FF561E] focus:ring-2 focus:ring-[#FF561E]/10 transition-all disabled:opacity-60"
              />
            ))}
          </div>

          <button
            onClick={() => submit()}
            disabled={loading || code.length !== 6}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#FF561E] text-white text-[14px] font-bold hover:bg-[#E04B18] transition-colors shadow-sm shadow-orange-500/20 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            Verify &amp; sign in
          </button>

          <div className="mt-5 text-center">
            <button
              onClick={() => router.push("/admin")}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#6B7280] hover:text-[#FF561E] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to sign in
            </button>
          </div>
        </div>

        <p className="flex items-center justify-center gap-1.5 text-center text-[12px] text-[#6B7280] mt-6">
          <Info className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
          Lost your device? Contact another super admin to reset your access.
        </p>
      </div>
    </div>
  );
}
