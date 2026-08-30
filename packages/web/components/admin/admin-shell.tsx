"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/admin-sidebar";

const STORAGE_KEY = "esim4u:admin-sidebar-collapsed";

export default function AdminShell({ children }: { children: React.ReactNode }) {
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
    <div className="min-h-screen bg-[#FAFAFA]">
      <AdminSidebar collapsed={collapsed} onToggle={toggle} />
      <div className={`flex flex-col min-h-screen transition-all duration-300 ${collapsed ? "lg:pl-[76px]" : "lg:pl-[260px]"}`}>
        {children}
      </div>
    </div>
  );
}
