"use client";

import DashboardTopbar from "@/components/dashboard/topbar";
import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { Loader2, ShoppingBag } from "lucide-react";
import OrderCard, { OrderSummary } from "@/components/dashboard/order-card";

type TxFilter = "all" | "completed" | "pending" | "failed";

const FILTERS: { key: TxFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "completed", label: "Completed" },
  { key: "pending", label: "Pending" },
  { key: "failed", label: "Failed" },
];

function normalizeStatus(status: string): TxFilter {
  if (status === "completed") return "completed";
  if (status === "failed") return "failed";
  return "pending";
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TxFilter>("all");

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

  const counts = useMemo(() => {
    const c: Record<TxFilter, number> = { all: orders.length, completed: 0, pending: 0, failed: 0 };
    for (const o of orders) c[normalizeStatus(o.status)]++;
    return c;
  }, [orders]);

  const filtered = useMemo(
    () => (filter === "all" ? orders : orders.filter((o) => normalizeStatus(o.status) === filter)),
    [orders, filter]
  );

  return (
    <>
      <DashboardTopbar title="Orders" />
      <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#FF561E] animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-[15px] text-[#6B7280] font-medium mb-3">No orders yet</p>
            <Link href="/dashboard/browse" className="text-[13px] text-[#FF561E] font-semibold">
              Browse eSIM Plans
            </Link>
          </div>
        ) : (
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 mb-5">
              {FILTERS.map((f) => {
                const active = filter === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold border transition-colors ${
                      active
                        ? "bg-[#FFF4F0] text-[#FF561E] border-[#FF561E]"
                        : "bg-white text-[#6B7280] border-gray-200 hover:text-[#FF561E] hover:border-orange-200"
                    }`}
                  >
                    {f.label}
                    <span className={`text-[11px] font-bold ${active ? "text-[#FF561E]/70" : "text-gray-400"}`}>{counts[f.key]}</span>
                  </button>
                );
              })}
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <p className="text-[14px] text-[#6B7280] font-medium">No {filter} orders.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
