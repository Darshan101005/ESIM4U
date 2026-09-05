"use client";

import type { ReactNode } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme-context";

export default function AdminTopbar({ title, right }: { title?: string; right?: ReactNode }) {
  const { toggleTheme } = useTheme();

  return (
    <header className="h-[70px] bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-6 lg:px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <div className="lg:hidden w-10" />
        {title && <h1 className="text-[20px] font-bold text-[#1A1D20] tracking-tight">{title}</h1>}
      </div>
      <div className="flex items-center gap-2">
        {right}
        <button
          onClick={toggleTheme}
          title="Toggle dark mode"
          aria-label="Toggle dark mode"
          className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-[#6B7280] hover:bg-[#FFF4F0] hover:text-[#FF561E] hover:border-orange-200 transition-colors"
        >
          <Moon className="w-[18px] h-[18px] theme-only-light" strokeWidth={2} />
          <Sun className="w-[18px] h-[18px] theme-only-dark" strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}
