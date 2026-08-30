"use client";

import { useEffect, useState } from "react";
import DashboardSidebar from "@/components/dashboard/sidebar";

const STORAGE_KEY = "esim4u:dashboard-sidebar-collapsed";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") setCollapsed(true);
    } catch {}
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {}
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] font-sans">
      <DashboardSidebar collapsed={collapsed} onToggle={toggle} />
      <div className={`min-h-screen flex flex-col transition-all duration-300 ${collapsed ? "lg:ml-[76px]" : "lg:ml-[260px]"}`}>
        {children}
      </div>
    </div>
  );
}
