"use client";

import DashboardTopbar from "@/components/dashboard/topbar";
import { useCachedSession } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Globe, ShoppingBag, Smartphone, ArrowRight, Package, Clock, CheckCircle2, XCircle } from "lucide-react";

interface Order {
  id: number;
  bundle_name: string;
  country: string;
  price: string;
  status: string;
  created_at: string;
}

export default function DashboardPage() {
  const { data: session, isPending } = useCachedSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const user = session?.user as { name?: string; id?: string } | undefined;

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
      return;
    }

    if (session) {
      fetch("/api/orders")
        .then((res) => res.json())
        .then((data) => {
          setOrders(data.orders || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-[#FF561E] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!session) return null;

  const completedOrders = orders.filter((o) => o.status === "completed");
  const totalSpent = completedOrders.reduce((sum, o) => sum + parseFloat(o.price || "0"), 0);

  const statusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" strokeWidth={2.5} />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" strokeWidth={2.5} />;
      default:
        return <Clock className="w-4 h-4 text-amber-500" strokeWidth={2.5} />;
    }
  };

  return (
    <>
      <DashboardTopbar title="Overview" />
      <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8">
        <div className="mb-8">
          <h2 className="text-[28px] font-bold text-[#1A1D20] tracking-tight">
            Welcome back, {user?.name || "User"}
          </h2>
          <p className="text-[15px] text-[#6B7280] font-medium mt-1">
            Here&apos;s a summary of your eSIM activity.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-xl bg-[#FFF4F0] flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-[#FF561E]" strokeWidth={2} />
              </div>
            </div>
            <p className="text-[13px] text-[#6B7280] font-medium mb-1">Active eSIMs</p>
            <p className="text-[28px] font-bold text-[#1A1D20]">{loading ? "..." : completedOrders.length}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-xl bg-[#FFF4F0] flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-[#FF561E]" strokeWidth={2} />
              </div>
            </div>
            <p className="text-[13px] text-[#6B7280] font-medium mb-1">Total Orders</p>
            <p className="text-[28px] font-bold text-[#1A1D20]">{loading ? "..." : orders.length}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-xl bg-[#FFF4F0] flex items-center justify-center">
                <Package className="w-5 h-5 text-[#FF561E]" strokeWidth={2} />
              </div>
            </div>
            <p className="text-[13px] text-[#6B7280] font-medium mb-1">Total Spent</p>
            <p className="text-[28px] font-bold text-[#1A1D20]">{loading ? "..." : `$${totalSpent.toFixed(2)}`}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-8">
          <Link href="/dashboard/browse" className="group bg-gradient-to-br from-[#FF561E] to-[#E04B18] rounded-2xl p-6 text-white shadow-lg shadow-orange-500/15 flex items-center justify-between hover:shadow-xl hover:shadow-orange-500/25 transition-all duration-300">
            <div>
              <h3 className="text-[18px] font-bold mb-1">Browse eSIM Plans</h3>
              <p className="text-[14px] text-white/80 font-medium">Find the perfect plan for your next trip</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center group-hover:bg-white/25 transition-colors">
              <Globe className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
          </Link>

          <Link href="/dashboard/esims" className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center justify-between hover:border-orange-100 hover:shadow-md transition-all duration-300">
            <div>
              <h3 className="text-[18px] font-bold text-[#1A1D20] mb-1">View My eSIMs</h3>
              <p className="text-[14px] text-[#6B7280] font-medium">Check usage, QR codes & installation</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#FFF4F0] flex items-center justify-center group-hover:bg-[#FFECE4] transition-colors">
              <Smartphone className="w-6 h-6 text-[#FF561E]" strokeWidth={2} />
            </div>
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <h3 className="text-[16px] font-bold text-[#1A1D20]">Recent Orders</h3>
            <Link href="/dashboard/orders" className="flex items-center gap-1 text-[13px] font-semibold text-[#FF561E] hover:text-[#E04B18] transition-colors">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-8 flex items-center justify-center">
              <div className="animate-spin w-6 h-6 border-3 border-[#FF561E] border-t-transparent rounded-full" />
            </div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center">
              <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-[14px] text-[#6B7280] font-medium">No orders yet</p>
              <Link href="/dashboard/browse" className="text-[13px] text-[#FF561E] font-semibold mt-2 inline-block">
                Browse eSIM Plans
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {orders.slice(0, 5).map((order) => (
                <Link key={order.id} href={`/dashboard/orders/${order.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#FFF4F0] flex items-center justify-center">
                      <Globe className="w-5 h-5 text-[#FF561E]" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-[#1A1D20]">{order.bundle_name || order.country || "eSIM Plan"}</p>
                      <p className="text-[12px] text-[#6B7280]">{new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[14px] font-bold text-[#1A1D20]">${parseFloat(order.price).toFixed(2)}</span>
                    {statusIcon(order.status)}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
