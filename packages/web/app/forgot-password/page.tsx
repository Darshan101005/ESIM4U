"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowLeft, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

type Stage = "email" | "reset" | "done";

const inputCls =
  "w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F9FAFB] border border-gray-200 text-[13px] text-[#1A1D20] placeholder:text-[#9CA3AF] outline-none focus:border-[#FF561E] focus:ring-2 focus:ring-[#FF561E]/10 transition-all font-medium";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [resendsLeft, setResendsLeft] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 30-second countdown between resend attempts.
  const startCooldown = () => {
    setCooldown(30);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (loading) return;
    // A resend is blocked while the cooldown is running.
    if (stage === "reset" && cooldown > 0) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    setEmailError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // 404 = no such account; keep the user on the email step and show it inline.
        if (res.status === 404) {
          setEmailError(data.error || "No account found for this email address.");
        } else if (res.status === 429) {
          setResendsLeft(0);
          toast.error(data.error || "Too many attempts. Please try again in an hour.");
        } else {
          toast.error(data.error || "Could not send the code");
        }
      } else {
        toast.success("A reset code has been sent to your email.");
        if (typeof data.remainingResends === "number") setResendsLeft(data.remainingResends);
        setStage("reset");
        startCooldown();
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!/^\d{6}$/.test(otp)) {
      toast.error("Enter the 6-digit code from your email");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword: password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Could not reset your password");
      } else {
        setStage("done");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FF561E] flex items-center justify-center relative overflow-hidden px-5 py-10 font-sans">
      <div className="absolute top-[-15%] right-[-8%] w-[500px] h-[500px] rounded-full bg-white/[0.06]"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-white/[0.04]"></div>
      <div className="absolute top-[30%] right-[15%] w-[200px] h-[200px] rounded-full bg-white/[0.03]"></div>

      <div className={`w-full flex items-center justify-center transition-all duration-1000 ease-out ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
        <div
          className="hidden lg:block absolute z-20 pointer-events-none"
          style={{ bottom: "5%", left: "calc(50% - 360px)" }}
        >
          <div className="relative w-[210px] h-[300px]">
            <Image
              src="/assets/Signup&Login/Boy-with-mobile.png"
              alt="Boy with mobile"
              fill
              className="object-contain object-bottom drop-shadow-[0_8px_24px_rgba(0,0,0,0.15)]"
              priority
            />
          </div>
        </div>

        <div className="relative z-10 bg-white rounded-[28px] p-6 md:p-7 w-[410px] max-w-[92vw] shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
        <div className="flex flex-col items-center mb-5">
          <Link href="/" className="transition-transform duration-300 hover:scale-105">
            <Image src="/assets/esim4u-logo.png" alt="eSIM4U Logo" width={130} height={40} className="object-contain mb-3" priority />
          </Link>
          {stage !== "done" && (
            <>
              <h1 className="text-[24px] font-bold text-[#1A1D20] tracking-tight mb-1">
                {stage === "email" ? "Forgot password?" : "Reset your password"}
              </h1>
              <p className="text-[13px] text-[#6B7280] font-medium text-center leading-relaxed">
                {stage === "email"
                  ? "Enter your email and we'll send you a reset code."
                  : `Enter the code sent to ${email} and choose a new password.`}
              </p>
            </>
          )}
        </div>

        {stage === "email" && (
          <form className="flex flex-col gap-4" onSubmit={sendCode}>
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-bold text-[#1A1D20]">Email address</label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-[#9CA3AF] group-focus-within:text-[#FF561E] transition-colors" strokeWidth={1.8} />
                <input type="email" placeholder="Enter your email" value={email} onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(""); }} className={`${inputCls} ${emailError ? "border-red-300 focus:border-red-400 focus:ring-red-100" : ""}`} />
              </div>
              {emailError && <p className="text-[12px] font-medium text-red-500 mt-0.5">{emailError}</p>}
            </div>
            <button type="submit" disabled={loading} className="w-full py-2.5 rounded-xl bg-[#FF561E] text-white font-bold text-[15px] hover:shadow-lg hover:shadow-orange-500/25 transition-all active:scale-[0.98] disabled:opacity-70">
              {loading ? "Sending…" : "Send reset code"}
            </button>
          </form>
        )}

        {stage === "reset" && (
          <form className="flex flex-col gap-3.5" onSubmit={reset}>
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-bold text-[#1A1D20]">Verification code</label>
              <div className="relative group">
                <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-[#9CA3AF] group-focus-within:text-[#FF561E] transition-colors" strokeWidth={1.8} />
                <input inputMode="numeric" maxLength={6} placeholder="6-digit code" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} className={`${inputCls} tracking-[0.3em]`} />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-bold text-[#1A1D20]">New password</label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-[#9CA3AF] group-focus-within:text-[#FF561E] transition-colors" strokeWidth={1.8} />
                <input type={showPw ? "text" : "password"} placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-[#F9FAFB] border border-gray-200 text-[13px] text-[#1A1D20] placeholder:text-[#9CA3AF] outline-none focus:border-[#FF561E] focus:ring-2 focus:ring-[#FF561E]/10 transition-all font-medium" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors">
                  {showPw ? <EyeOff className="w-[16px] h-[16px]" strokeWidth={1.8} /> : <Eye className="w-[16px] h-[16px]" strokeWidth={1.8} />}
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-bold text-[#1A1D20]">Confirm new password</label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-[#9CA3AF] group-focus-within:text-[#FF561E] transition-colors" strokeWidth={1.8} />
                <input type={showPw ? "text" : "password"} placeholder="Re-enter your new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F9FAFB] border border-gray-200 text-[13px] text-[#1A1D20] placeholder:text-[#9CA3AF] outline-none focus:border-[#FF561E] focus:ring-2 focus:ring-[#FF561E]/10 transition-all font-medium" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-2.5 rounded-xl bg-[#FF561E] text-white font-bold text-[15px] hover:shadow-lg hover:shadow-orange-500/25 transition-all active:scale-[0.98] disabled:opacity-70 mt-1">
              {loading ? "Resetting…" : "Reset password"}
            </button>
            <div className="flex flex-col items-center gap-0.5">
              <button
                type="button"
                onClick={() => sendCode()}
                disabled={loading || cooldown > 0 || resendsLeft === 0}
                className="text-[12px] font-semibold text-[#FF561E] hover:text-[#e04b19] transition-colors disabled:text-[#9CA3AF] disabled:cursor-not-allowed"
              >
                {resendsLeft === 0
                  ? "No resends left — try again in an hour"
                  : cooldown > 0
                  ? `Resend code in ${cooldown}s`
                  : "Didn't get a code? Resend"}
              </button>
              {resendsLeft !== null && resendsLeft > 0 && (
                <span className="text-[11px] text-[#9CA3AF]">{resendsLeft} resend{resendsLeft === 1 ? "" : "s"} left this hour</span>
              )}
            </div>
          </form>
        )}

        {stage === "done" && (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-[22px] font-bold text-[#1A1D20] mb-2">Password reset</h1>
            <p className="text-[13px] text-[#6B7280] font-medium mb-6">Your password has been updated. You can now sign in with your new password.</p>
            <button onClick={() => router.push("/login")} className="w-full py-2.5 rounded-xl bg-[#FF561E] text-white font-bold text-[15px] hover:shadow-lg hover:shadow-orange-500/25 transition-all active:scale-[0.98]">
              Back to login
            </button>
          </div>
        )}

        {stage !== "done" && (
          <div className="mt-5 text-center">
            <Link href="/login" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#6B7280] hover:text-[#FF561E] transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to login
            </Link>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
