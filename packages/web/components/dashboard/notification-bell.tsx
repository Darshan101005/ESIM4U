"use client";

import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-[#FFF4F0] hover:border-orange-200 transition-colors"
      >
        <Bell className="w-[18px] h-[18px] text-[#6B7280]" strokeWidth={2} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.12)] z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-[14px] font-bold text-[#1A1D20]">Notifications</p>
          </div>
          <div className="px-4 py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
              <Bell className="w-5 h-5 text-gray-300" strokeWidth={1.5} />
            </div>
            <p className="text-[13px] text-[#6B7280] font-medium">You&apos;re all caught up</p>
            <p className="text-[12px] text-gray-400 mt-0.5">No new notifications</p>
          </div>
        </div>
      )}
    </div>
  );
}
