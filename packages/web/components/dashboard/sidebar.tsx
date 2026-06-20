"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Globe,
  Smartphone,
  ShoppingBag,
  Wallet,
  ArrowLeftRight,
  Gift,
  Settings,
  Headset,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { useCachedSession, signOutAndClear } from "@/lib/auth-client";
import { Skeleton } from "@/components/dashboard/skeleton";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Browse eSIMs", href: "/dashboard/browse", icon: Globe },
  { label: "My eSIMs", href: "/dashboard/esims", icon: Smartphone },
  { label: "Orders", href: "/dashboard/orders", icon: ShoppingBag },
  { label: "Top Up", href: "/dashboard/topup", icon: Wallet },
  { label: "Transactions", href: "/dashboard/transactions", icon: ArrowLeftRight },
  { label: "Referrals", href: "/dashboard/referrals", icon: Gift, badge: "New" },
  { label: "Support", href: "/dashboard/support", icon: Headset },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session, isPending } = useCachedSession();
  const user = session?.user as { name?: string; email?: string } | undefined;
  const initial = (user?.name || user?.email || "U").charAt(0).toUpperCase();

  const handleSignOut = async () => {
    await signOutAndClear();
    router.push("/login");
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="px-6 py-6 flex items-center">
        <Link href="/" className="flex items-center">
          <Image src="/assets/esim4u-logo.png" alt="eSIM4U" width={120} height={36} className="object-contain" priority />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
        <nav className="px-3 py-1 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-200 ${
                  active
                    ? "bg-gradient-to-r from-[#FF561E] to-[#FF7A45] text-white"
                    : "text-[#6B7280] hover:bg-[#FFF4F0] hover:text-[#FF561E]"
                }`}
              >
                <Icon className="w-[18px] h-[18px]" strokeWidth={active ? 2.5 : 2} />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      active ? "bg-white/25 text-white" : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pt-3 mt-auto">
          <div className="rounded-2xl bg-[#FFF4F0] border border-orange-100/70 p-3.5">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-lg bg-[#FF561E] flex items-center justify-center">
                <Gift className="w-3.5 h-3.5 text-white" strokeWidth={2.2} />
              </div>
              <span className="text-[13px] font-bold text-[#1A1D20]">Refer &amp; Earn</span>
            </div>
            <p className="text-[11.5px] text-[#6B7280] leading-snug">
              Invite friends and earn <span className="font-bold text-[#FF561E]">$3.00 credit</span>
            </p>
            <Link
              href="/dashboard/referrals"
              onClick={() => setMobileOpen(false)}
              className="block text-center w-full py-2 mt-2.5 rounded-xl border border-[#FF561E]/40 text-[#FF561E] text-[13px] font-bold hover:bg-[#FF561E] hover:text-white transition-colors"
            >
              Invite Now
            </Link>
          </div>
        </div>
      </div>

      <div className="px-3 pb-4 border-t border-gray-100 pt-3 space-y-1 shrink-0">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors">
          {isPending ? (
            <div className="flex items-center gap-3 flex-1">
              <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-2.5 w-32" />
              </div>
            </div>
          ) : (
            <>
              <Link
                href="/dashboard/profile"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 min-w-0 flex-1"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF561E] to-[#FF7A45] flex items-center justify-center shrink-0">
                  <span className="text-white text-[14px] font-bold">{initial}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-[#1A1D20] truncate leading-tight">{user?.name || "My Profile"}</p>
                  <p className="text-[11px] text-[#6B7280] truncate leading-tight">{user?.email || ""}</p>
                </div>
              </Link>
              <Link
                href="/dashboard/settings"
                onClick={() => setMobileOpen(false)}
                title="Settings"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B7280] hover:bg-[#FFF4F0] hover:text-[#FF561E] transition-colors shrink-0"
              >
                <Settings className="w-[18px] h-[18px]" strokeWidth={2} />
              </Link>
            </>
          )}
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[14px] font-medium text-[#6B7280] hover:bg-red-50 hover:text-red-500 transition-all duration-200 w-full"
        >
          <LogOut className="w-[18px] h-[18px]" strokeWidth={2} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-white shadow-md border border-gray-100 flex items-center justify-center"
      >
        <Menu className="w-5 h-5 text-[#1A1D20]" />
      </button>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[280px] bg-white shadow-2xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center z-10"
            >
              <X className="w-4 h-4 text-[#1A1D20]" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      <aside className="hidden lg:flex w-[260px] bg-white border-r border-gray-100 flex-col fixed left-0 top-0 bottom-0 z-40">
        {sidebarContent}
      </aside>
    </>
  );
}
