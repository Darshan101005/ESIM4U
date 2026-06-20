"use client";

import dynamic from "next/dynamic";
import { Globe } from "lucide-react";
import { toAlpha2 } from "@/lib/flags";

const KOSOVO_CODES = new Set(["XK", "XKX", "RKS", "KOS"]);

const Flagpack = dynamic<{ code: string; size?: string; hasBorder?: boolean; hasBorderRadius?: boolean; className?: string }>(
  () => import("react-flagpack").then((m) => m.default || m),
  { ssr: false }
);

interface FlagProps {
  code?: string;
  size?: "s" | "m" | "l";
  className?: string;
}

export default function Flag({ code, size = "m", className = "" }: FlagProps) {
  if (code && KOSOVO_CODES.has(code.trim().toUpperCase())) {
    return (
      <div className={`flex items-center justify-center overflow-hidden ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/Flag_of_Kosovo.svg.webp" alt="Kosovo" className="w-full h-full object-cover" />
      </div>
    );
  }

  const alpha2 = toAlpha2(code);

  if (!alpha2) {
    return (
      <div className={`flex items-center justify-center bg-[#FFF4F0] ${className}`}>
        <Globe className="w-1/2 h-1/2 text-[#FF561E]" strokeWidth={2} />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Flagpack
        code={alpha2}
        size={size === "m" ? "l" : size}
        hasBorder={false}
        hasBorderRadius={false}
        className="country-flag"
      />
    </div>
  );
}
