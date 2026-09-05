"use client";

import { useCallback, useEffect, useState } from "react";
import DashboardSidebar from "@/components/dashboard/sidebar";
import ThemeInitScript from "@/components/theme-init-script";
import { ThemeContext, readStoredTheme, type Theme } from "@/lib/theme-context";

const STORAGE_KEY = "esim4u:dashboard-sidebar-collapsed";
const THEME_KEY = "esim4u:dashboard-theme";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => readStoredTheme(THEME_KEY));

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") setCollapsed(true);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
  }, [theme]);

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {}
      return next;
    });
  };

  const toggleTheme = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className={`min-h-screen bg-[#F8F9FB] font-sans ${theme === "dark" ? "theme-dark" : ""}`} suppressHydrationWarning>
        <ThemeInitScript storageKey={THEME_KEY} />
        <DashboardSidebar collapsed={collapsed} onToggle={toggle} />
        <div className={`min-h-screen flex flex-col transition-all duration-300 ${collapsed ? "lg:ml-[76px]" : "lg:ml-[260px]"}`}>
          {children}
        </div>
      </div>
    </ThemeContext.Provider>
  );
}
