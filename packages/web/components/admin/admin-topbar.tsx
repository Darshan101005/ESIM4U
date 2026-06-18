"use client";

import { ShieldCheck } from "lucide-react";

export default function AdminTopbar({ title }: { title?: string }) {
  return (
    <header className="h-[70px] bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-6 lg:px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <div className="lg:hidden w-10" />
        {title && <h1 className="text-[20px] font-bold text-[#1A1D20] tracking-tight">{title}</h1>}
      </div>

      <div className="flex items-center gap-3 pl-3">
        <div className="w-9 h-9 rounded-xl bg-[#1A1D20] flex items-center justify-center">
          <ShieldCheck className="w-[16px] h-[16px] text-white" strokeWidth={2.5} />
        </div>
        <div className="hidden sm:flex flex-col">
          <span className="text-[13px] font-semibold text-[#1A1D20] leading-tight">Administrator</span>
          <span className="text-[11px] text-[#6B7280] leading-tight">eSIM4U Control Panel</span>
        </div>
      </div>
    </header>
  );
}
