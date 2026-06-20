"use client";

import DashboardTopbar from "@/components/dashboard/topbar";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Loader2, Smartphone, ChevronRight } from "lucide-react";
import Flag from "@/components/dashboard/flag";

interface EsimOrder {
  id: number;
  bundle_name?: string;
  country?: string;
  country_code?: string;
  data_amount?: string;
  validity?: string;
  status: string;
  iccid?: string;
  bundle_expiry_date?: string;
  created_at: string;
}

export default function EsimsPage() {
  const [orders, setOrders] = useState<EsimOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOrders((data.orders || []).filter((o: EsimOrder) => o.status === "completed"));
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
      <DashboardTopbar title="My eSIMs" />
      <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#FF561E] animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <Smartphone className="w-12 h-12 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-[15px] text-[#6B7280] font-medium mb-3">No active eSIMs</p>
            <Link href="/dashboard/browse" className="text-[13px] text-[#FF561E] font-semibold">
              Browse eSIM Plans
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/dashboard/orders/${order.id}`}
                className="group bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 hover:border-orange-100 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-9 rounded-md overflow-hidden border border-gray-100 shrink-0 relative">
                      <Flag code={order.country_code} className="w-full h-full" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[15px] font-bold text-[#1A1D20] truncate">{order.bundle_name || order.country}</p>
                      <p className="text-[12px] text-[#6B7280]">{order.data_amount}{order.validity ? ` · ${order.validity}` : ""}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#FF561E] transition-colors shrink-0" />
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-semibold">
                    Active
                  </span>
                  {order.iccid && <span className="text-[11px] text-[#6B7280] font-mono truncate max-w-[160px]">{order.iccid}</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
