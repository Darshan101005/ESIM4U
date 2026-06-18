"use client";

import dynamic from "next/dynamic";
import { Globe } from "lucide-react";
import { toAlpha2 } from "@/lib/flags";

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
  const alpha2 = toAlpha2(code);

  if (!alpha2) {
    return (
      <div className={`flex items-center justify-center bg-[#FFF4F0] ${className}`}>
        <Globe className="w-1/2 h-1/2 text-[#FF561E]" strokeWidth={2} />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center overflow-hidden ${className}`}>
      <Flagpack code={alpha2} size={size === "m" ? "l" : size} hasBorder={false} hasBorderRadius={false} />
    </div>
  );
}
