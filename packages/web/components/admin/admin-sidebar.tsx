"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { LayoutDashboard, Users, ShoppingBag, Tag, Package, LogOut, Menu, X, ShieldCheck, Ticket, Megaphone, Settings, UserCog } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

const navItems = [
  { label: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Pricing & Markup", href: "/admin/dashboard/pricing", icon: Tag },
  { label: "Bundles", href: "/admin/dashboard/bundles", icon: Package },
  { label: "Orders", href: "/admin/dashboard/orders", icon: ShoppingBag },
  { label: "Promo Codes", href: "/admin/dashboard/promo", icon: Ticket },
  { label: "Affiliates", href: "/admin/dashboard/affiliate", icon: Megaphone },
  { label: "Customers", href: "/admin/dashboard/users", icon: Users },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [admin, setAdmin] = useState<{ name: string; email: string; role: string }>({
    name: "Darshan V",
    email: "",
    role: "admin",
  });

  useEffect(() => {
    fetch("/api/admin/me", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.name) setAdmin({ name: data.name, email: data.email || "", role: data.role || "admin" });
      })
      .catch(() => {});
  }, []);

  const isSuper = admin.role === "super_admin";
  const RoleIcon = isSuper ? ShieldCheck : UserCog;
  const roleLabel = isSuper ? "Super Admin" : "Admin";

  const adminInitial = (admin.name || "D").trim().charAt(0).toUpperCase();

  const handleSignOut = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      toast.error("Sign out failed");
    }
    router.push("/admin");
  };

  const isActive = (href: string) => {
    if (href === "/admin/dashboard") return pathname === "/admin/dashboard";
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="px-6 py-6 flex items-center gap-2">
        <Link href="/admin/dashboard" className="flex items-center">
          <Image src="/assets/esim4u-logo.png" alt="eSIM4U" width={110} height={32} className="object-contain" priority />
        </Link>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FFF4F0] text-[#FF561E] text-[10px] font-bold uppercase tracking-wide">
          <ShieldCheck className="w-3 h-3" /> Admin
        </span>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium transition-all duration-200 ${
                active
                  ? "bg-[#FF561E] text-white shadow-lg shadow-orange-500/20"
                  : "text-[#6B7280] hover:bg-[#FFF4F0] hover:text-[#FF561E]"
              }`}
            >
              <Icon className="w-[18px] h-[18px]" strokeWidth={active ? 2.5 : 2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-6 space-y-2">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-[#FFF4F0] border border-orange-100">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF561E] to-[#FF7A45] flex items-center justify-center shrink-0">
            <span className="text-white text-[14px] font-bold">{adminInitial}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-[#1A1D20] truncate">{admin.name}</p>
            <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#FF561E]">
              <RoleIcon className="w-3.5 h-3.5" strokeWidth={2.2} /> {roleLabel}
            </span>
          </div>
          <Link
            href="/admin/dashboard/settings"
            onClick={() => setMobileOpen(false)}
            title="Settings"
            className="w-8 h-8 rounded-lg bg-white border border-orange-100 flex items-center justify-center text-[#6B7280] hover:text-[#FF561E] hover:border-[#FF561E]/40 transition-colors shrink-0"
          >
            <Settings className="w-4 h-4" strokeWidth={2} />
          </Link>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium text-[#6B7280] hover:bg-red-50 hover:text-red-500 transition-all duration-200 w-full"
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
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"
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
