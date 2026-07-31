"use client";

import type { ReactNode } from "react";

export default function AdminTopbar({ title, right }: { title?: string; right?: ReactNode }) {
  return (
    <header className="h-[70px] bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-6 lg:px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <div className="lg:hidden w-10" />
        {title && <h1 className="text-[20px] font-bold text-[#1A1D20] tracking-tight">{title}</h1>}
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </header>
  );
}
