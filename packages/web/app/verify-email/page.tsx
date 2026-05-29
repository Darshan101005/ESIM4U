"use client";

import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { Mail } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const router = useRouter();
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [remainingResends, setRemainingResends] = useState(3);
  const [cooldown, setCooldown] = useState(0);
  const [mounted, setMounted] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!email) {
      router.push("/signup");
    }
  }, [email, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleInputChange = useCallback(
    (index: number, value: string) => {
      if (value && !/^[0-9]$/.test(value)) return;
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [otp]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [otp]
  );

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedData) return;
    const newOtp = ["", "", "", "", "", ""];
    pastedData.split("").forEach((char, i) => {
      newOtp[i] = char;
    });
    setOtp(newOtp);
    const focusIndex = Math.min(pastedData.length, 5);
    inputRefs.current[focusIndex]?.focus();
  }, []);

  const handleVerify = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) return;

    setIsVerifying(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpString }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Invalid verification code");
        return;
      }

      toast.success("Email verified successfully!");
      router.push("/login");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || remainingResends <= 0) return;

    setIsResending(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to resend code");
        return;
      }

      setRemainingResends((prev) => prev - 1);
      setCooldown(60);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      toast.success("Verification code resent!");
    } catch {
      toast.error("Failed to resend code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const isOtpComplete = otp.every((digit) => digit !== "");

  if (!email) return null;

  return (
    <div className="h-screen w-full bg-[#FF561E] flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-[-5%] right-[-10%] w-[450px] h-[450px] rounded-full bg-white/[0.06]"></div>
      <div className="absolute bottom-[-20%] left-[-5%] w-[550px] h-[550px] rounded-full bg-white/[0.04]"></div>
      <div className="absolute top-[40%] left-[8%] w-[180px] h-[180px] rounded-full bg-white/[0.03]"></div>

      <div className={`relative z-10 transition-all duration-1000 ease-out ${
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}>
        <div className="bg-white rounded-[28px] p-6 md:p-8 w-[430px] max-w-[92vw] shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
          <div className="flex flex-col items-center mb-5">
            <Link href="/" className="transition-transform duration-300 hover:scale-105">
              <Image
                src="/assets/esim4u-logo.png"
                alt="eSIM4U Logo"
                width={130}
                height={40}
                className="object-contain mb-4"
                priority
              />
            </Link>

            <div className="w-14 h-14 rounded-full bg-[#FFF0EB] flex items-center justify-center mb-3">
              <Mail className="w-6 h-6 text-[#FF561E]" strokeWidth={1.8} />
            </div>

            <h1 className="text-[23px] md:text-[25px] font-bold text-[#1A1D20] tracking-tight mb-1">
              Verify your email
            </h1>
            <p className="text-[13px] text-[#6B7280] font-medium text-center leading-relaxed">
              We&apos;ve sent a 6-digit verification code to
            </p>
            <p className="text-[13px] font-bold text-[#1A1D20] truncate max-w-full">
              {email}
            </p>
          </div>

          <div className="flex justify-center gap-2.5 mb-5" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-11 h-12 text-center text-[20px] font-bold text-[#1A1D20] bg-[#F9FAFB] border border-gray-200 rounded-xl outline-none focus:border-[#FF561E] focus:ring-2 focus:ring-[#FF561E]/10 transition-all"
              />
            ))}
          </div>

          <button
            onClick={handleVerify}
            disabled={!isOtpComplete || isVerifying}
            className={`w-full py-2.5 rounded-xl bg-[#FF561E] text-white font-bold text-[15px] hover:shadow-lg hover:shadow-orange-500/25 transition-all duration-300 active:scale-[0.98] ${
              !isOtpComplete || isVerifying ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {isVerifying ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Verifying...
              </span>
            ) : (
              "Verify Email"
            )}
          </button>

          <div className="flex flex-col items-center mt-4 gap-1">
            <p className="text-[13px] text-[#6B7280] font-medium">
              Didn&apos;t receive the code?
            </p>
            {cooldown > 0 ? (
              <span className="text-[13px] font-semibold text-[#9CA3AF]">
                Resend in {cooldown}s
              </span>
            ) : (
              <button
                onClick={handleResend}
                disabled={isResending || remainingResends <= 0}
                className={`text-[13px] font-bold transition-colors ${
                  remainingResends <= 0
                    ? "text-[#9CA3AF] cursor-not-allowed"
                    : "text-[#FF561E] hover:text-[#e04b19]"
                }`}
              >
                {isResending ? "Resending..." : "Resend Code"}
              </button>
            )}
            <span className="text-[11px] text-[#9CA3AF] font-medium">
              {remainingResends} resends remaining
            </span>
          </div>

          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-[12px] text-[#9CA3AF] font-medium text-center mb-2.5">
              Open your email
            </p>
            <div className="flex items-center justify-center gap-2">
              <a
                href="https://mail.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 text-[12px] font-semibold text-[#1A1D20] active:scale-[0.97]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z" fill="#EA4335"/>
                </svg>
                Gmail
              </a>
              <a
                href="https://outlook.live.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 text-[12px] font-semibold text-[#1A1D20] active:scale-[0.97]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z" fill="#0078D4"/>
                </svg>
                Outlook
              </a>
              <a
                href="https://mail.yahoo.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 text-[12px] font-semibold text-[#1A1D20] active:scale-[0.97]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z" fill="#6001D2"/>
                </svg>
                Yahoo
              </a>
            </div>
          </div>

          <p className="text-center text-[12px] text-[#6B7280] font-medium mt-5">
            Wrong email?{" "}
            <Link href="/signup" className="text-[#FF561E] font-bold hover:underline transition-all">
              Back to signup
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-full flex items-center justify-center bg-[#FF561E]">
          <div className="animate-spin w-10 h-10 border-4 border-white border-t-transparent rounded-full" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
