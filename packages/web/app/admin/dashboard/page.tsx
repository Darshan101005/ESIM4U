"use client";

import AdminTopbar from "@/components/admin/admin-topbar";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Users, ShoppingBag, DollarSign, TrendingUp, Wallet, Loader2, ArrowRight, CheckCircle2, Clock, XCircle, ShieldCheck } from "lucide-react";
import StatCard from "@/components/dashboard/stat-card";
import AdminNotificationBell from "@/components/admin/admin-notification-bell";

interface DashboardData {
  stats: {
    totalUsers: number;
    totalOrders: number;
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    walletBalance: number | null;
    walletCurrency: string;
  };
  sales: {
    grossSalesUsd: number;
    netSalesUsd: number;
    topBundles: Array<{ bundle_name?: string; count?: number }>;
  } | null;
  recentOrders: Array<{
    id: number;
    user_email: string;
    bundle_name?: string;
    country?: string;
    price: string;
    status: string;
    created_at: string;
  }>;
}

function statusBadge(status: string) {
  if (status === "completed")
    return <span className="inline-flex items-center gap-1 text-emerald-600 text-[12px] font-semibold"><CheckCircle2 className="w-3.5 h-3.5" /> Completed</span>;
  if (status === "failed")
    return <span className="inline-flex items-center gap-1 text-red-500 text-[12px] font-semibold"><XCircle className="w-3.5 h-3.5" /> Failed</span>;
  return <span className="inline-flex items-center gap-1 text-amber-600 text-[12px] font-semibold"><Clock className="w-3.5 h-3.5" /> Pending</span>;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/dashboard");
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    fetch("/api/admin/me", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => setIsSuperAdmin(d?.role === "super_admin"))
      .catch(() => {});
  }, [load]);

  const s = data?.stats;
  const currency = s?.walletCurrency || "USD";

  return (
    <>
      <AdminTopbar
        title="Overview"
        right={
          <>
            <AdminNotificationBell />
            {isSuperAdmin && (
              <Link
                href="/admin/dashboard/manage"
                title="Manage Admins"
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl bg-[#FF561E] text-white text-[13px] font-bold hover:bg-[#E04B18] transition-colors shadow-sm shadow-orange-500/25 shrink-0 whitespace-nowrap"
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Manage Admins</span>
              </Link>
            )}
          </>
        }
      />
      <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8 max-w-6xl mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#FF561E] animate-spin" />
          </div>
        ) : !data ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
            <p className="text-[14px] text-red-600 font-medium">Failed to load dashboard</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
              <StatCard label="Customers" value={s!.totalUsers} icon={Users} />
              <StatCard label="Total Orders" value={s!.totalOrders} icon={ShoppingBag} />
              <StatCard label="Revenue" value={`$${s!.totalRevenue.toFixed(2)}`} icon={DollarSign} />
              <StatCard label="Profit" value={`$${s!.totalProfit.toFixed(2)}`} icon={TrendingUp} hint="Revenue minus cost" />
              <StatCard
                label="Reseller Wallet"
                value={s!.walletBalance !== null ? `${s!.walletBalance.toFixed(2)} ${currency}` : "—"}
                icon={Wallet}
                hint="MontyeSIM balance"
              />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-8">
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <h3 className="text-[16px] font-bold text-[#1A1D20]">Recent Orders</h3>
                <Link href="/admin/dashboard/orders" className="flex items-center gap-1 text-[13px] font-semibold text-[#FF561E] hover:text-[#E04B18] transition-colors">
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              {data.recentOrders.length === 0 ? (
                <div className="p-8 text-center">
                  <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
                  <p className="text-[14px] text-[#6B7280] font-medium">No orders yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {data.recentOrders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/admin/dashboard/orders/${order.id}`}
                      className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-[14px] font-semibold text-[#1A1D20] truncate">{order.bundle_name || order.country || "eSIM Plan"}</p>
                        <p className="text-[12px] text-[#6B7280] truncate">{order.user_email}</p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-[14px] font-bold text-[#1A1D20]">${parseFloat(order.price).toFixed(2)}</span>
                        {statusBadge(order.status)}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </>
  );
}
