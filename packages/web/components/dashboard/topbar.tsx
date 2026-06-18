"use client";

import { useCachedSession } from "@/lib/auth-client";
import { User, Bell } from "lucide-react";

export default function DashboardTopbar({ title }: { title?: string }) {
  const { data: session } = useCachedSession();
  const user = session?.user as { name?: string; email?: string } | undefined;

  return (
    <header className="h-[70px] bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-6 lg:px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <div className="lg:hidden w-10" />
        {title && (
          <h1 className="text-[20px] font-bold text-[#1A1D20] tracking-tight">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center hover:bg-[#FFF4F0] hover:border-orange-100 transition-colors">
          <Bell className="w-[18px] h-[18px] text-[#6B7280]" strokeWidth={2} />
        </button>

        <div className="flex items-center gap-3 pl-3 border-l border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-[#FF561E] flex items-center justify-center">
            <User className="w-[16px] h-[16px] text-white" strokeWidth={2.5} />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-[13px] font-semibold text-[#1A1D20] leading-tight">{user?.name || "User"}</span>
            <span className="text-[11px] text-[#6B7280] leading-tight">{user?.email || ""}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
