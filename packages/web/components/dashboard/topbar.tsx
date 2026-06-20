"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import CurrencyDropdown from "@/components/dashboard/currency-dropdown";
import NotificationBell from "@/components/dashboard/notification-bell";

export default function DashboardTopbar({ title }: { title?: string }) {
  const [cartCount, setCartCount] = useState(0);
  const pathname = usePathname();

  const loadCart = useCallback(async () => {
    try {
      const res = await fetch("/api/cart");
      if (!res.ok) return;
      const data = await res.json();
      setCartCount((data.items || []).length);
    } catch {}
  }, []);

  useEffect(() => {
    loadCart();
  }, [loadCart, pathname]);

  return (
    <header className="h-[70px] bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-6 lg:px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <div className="lg:hidden w-10" />
        {title && <h1 className="text-[20px] font-bold text-[#1A1D20] tracking-tight">{title}</h1>}
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/cart"
          className="relative w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-[#FFF4F0] hover:border-orange-200 transition-colors"
        >
          <ShoppingCart className="w-[18px] h-[18px] text-[#6B7280]" strokeWidth={2} />
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#FF561E] text-white text-[10px] font-bold flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </Link>

        <CurrencyDropdown />

        <NotificationBell />
      </div>
    </header>
  );
}
