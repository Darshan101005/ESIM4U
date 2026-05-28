"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="h-screen w-full bg-[#FF561E] flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-[-15%] right-[-8%] w-[500px] h-[500px] rounded-full bg-white/[0.06]"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-white/[0.04]"></div>
      <div className="absolute top-[30%] right-[15%] w-[200px] h-[200px] rounded-full bg-white/[0.03]"></div>

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

      <div
        className={`relative z-10 transition-all duration-700 ease-out ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        <div className="bg-white rounded-[28px] p-6 md:p-7 w-[410px] max-w-[92vw] shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
          <div className="flex flex-col items-center mb-4">
            <Link href="/" className="transition-transform duration-300 hover:scale-105">
              <Image
                src="/assets/esim4u-logo.png"
                alt="eSIM4U Logo"
                width={130}
                height={40}
                className="object-contain mb-3"
                priority
              />
            </Link>
            <h1 className="text-[24px] md:text-[26px] font-bold text-[#1A1D20] tracking-tight mb-1">
              Welcome back!
            </h1>
            <p className="text-[13px] text-[#6B7280] font-medium text-center leading-relaxed">
              Log in to your account and stay connected<br />anywhere in the world.
            </p>
          </div>

          <form className="flex flex-col gap-3.5" onSubmit={(e) => e.preventDefault()}>
            <div className="flex flex-col gap-1">
              <label htmlFor="login-email" className="text-[13px] font-bold text-[#1A1D20]">
                Email address
              </label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-[#9CA3AF] group-focus-within:text-[#FF561E] transition-colors" strokeWidth={1.8} />
                <input
                  id="login-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F9FAFB] border border-gray-200 text-[13px] text-[#1A1D20] placeholder:text-[#9CA3AF] outline-none focus:border-[#FF561E] focus:ring-2 focus:ring-[#FF561E]/10 transition-all font-medium"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="text-[13px] font-bold text-[#1A1D20]">
                  Password
                </label>
                <Link href="/forgot-password" className="text-[12px] font-semibold text-[#FF561E] hover:text-[#e04b19] transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-[#9CA3AF] group-focus-within:text-[#FF561E] transition-colors" strokeWidth={1.8} />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-[#F9FAFB] border border-gray-200 text-[13px] text-[#1A1D20] placeholder:text-[#9CA3AF] outline-none focus:border-[#FF561E] focus:ring-2 focus:ring-[#FF561E]/10 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-[16px] h-[16px]" strokeWidth={1.8} />
                  ) : (
                    <Eye className="w-[16px] h-[16px]" strokeWidth={1.8} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#FF561E] text-white font-bold text-[15px]  hover:shadow-lg hover:shadow-orange-500/25 transition-all duration-300 active:scale-[0.98] mt-0.5"
            >
              Log In
            </button>
          </form>

          <div className="flex items-center gap-3 my-3.5">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-[12px] text-[#9CA3AF] font-medium whitespace-nowrap">or continue with</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 text-[13px] font-semibold text-[#1A1D20] active:scale-[0.97]">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 text-[13px] font-semibold text-[#1A1D20] active:scale-[0.97]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#000000">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              Apple
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 text-[13px] font-semibold text-[#1A1D20] active:scale-[0.97]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </button>
          </div>

          <p className="text-center text-[16px] text-[#6B7280] font-medium mt-5">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-[#FF561E] font-bold hover:text-[#e04b19] hover:underline transition-all">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
