"use client";

import DashboardTopbar from "@/components/dashboard/topbar";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Loader2, ArrowLeftRight, ArrowDownLeft } from "lucide-react";
import { useCurrency } from "@/lib/currency-context";

interface Order {
  id: number;
  bundle_name?: string;
  country?: string;
  order_reference: string;
  price: string;
  status: string;
  created_at: string;
}

function statusPill(status: string) {
  const map: Record<string, string> = {
    completed: "bg-emerald-50 text-emerald-600",
    failed: "bg-red-50 text-red-500",
    pending: "bg-amber-50 text-amber-600",
  };
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ${map[status] || "bg-gray-100 text-[#6B7280]"}`}>
      {status}
    </span>
  );
}

export default function TransactionsPage() {
  const { format } = useCurrency();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <DashboardTopbar title="Transactions" />
      <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8 max-w-3xl">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#FF561E] animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <ArrowLeftRight className="w-12 h-12 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-[15px] font-semibold text-[#1A1D20]">No transactions yet</p>
            <p className="text-[13px] text-[#6B7280] mt-1 mb-4">Your purchases will appear here.</p>
            <Link href="/dashboard/browse" className="text-[13px] text-[#FF561E] font-semibold">Browse eSIM Plans</Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] divide-y divide-gray-50">
            {orders.map((o) => (
              <Link key={o.id} href={`/dashboard/orders/${o.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF4F0] flex items-center justify-center shrink-0">
                    <ArrowDownLeft className="w-5 h-5 text-[#FF561E]" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-[#1A1D20] truncate">{o.bundle_name || o.country || "eSIM purchase"}</p>
                    <p className="text-[11px] text-[#6B7280] font-mono truncate">{o.order_reference}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-[14px] font-bold text-[#1A1D20]">{format(parseFloat(o.price))}</p>
                    <p className="text-[11px] text-[#6B7280]">{new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                  </div>
                  {statusPill(o.status)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
