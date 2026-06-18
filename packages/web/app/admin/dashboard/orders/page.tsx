"use client";

import AdminTopbar from "@/components/admin/admin-topbar";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react";

interface Order {
  id: number;
  user_email: string;
  bundle_name?: string;
  country?: string;
  data_amount?: string;
  price: string;
  currency: string;
  status: string;
  created_at: string;
}

const STATUSES = [
  { value: "", label: "All" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "pending", label: "Pending" },
];

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

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (status) params.set("status", status);
      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <>
      <AdminTopbar title="Orders" />
      <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8">
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => {
                setStatus(s.value);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition-all ${
                status === s.value ? "bg-[#FF561E] text-white shadow-sm" : "bg-white border border-gray-200 text-[#6B7280] hover:text-[#FF561E]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#FF561E] animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-[14px] text-[#6B7280] font-medium">No orders found</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="px-5 py-3 text-[12px] font-semibold text-[#6B7280]">Customer</th>
                      <th className="px-5 py-3 text-[12px] font-semibold text-[#6B7280]">Plan</th>
                      <th className="px-5 py-3 text-[12px] font-semibold text-[#6B7280]">Date</th>
                      <th className="px-5 py-3 text-[12px] font-semibold text-[#6B7280] text-right">Amount</th>
                      <th className="px-5 py-3 text-[12px] font-semibold text-[#6B7280] text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {orders.map((order) => (
                      <tr
                        key={order.id}
                        onClick={() => router.push(`/admin/dashboard/orders/${order.id}`)}
                        className="hover:bg-gray-50/40 transition-colors cursor-pointer"
                      >
                        <td className="px-5 py-4 text-[13px] text-[#1A1D20] truncate max-w-[200px]">{order.user_email}</td>
                        <td className="px-5 py-4 text-[13px] font-semibold text-[#1A1D20]">{order.bundle_name || order.country || "eSIM Plan"}</td>
                        <td className="px-5 py-4 text-[13px] text-[#6B7280]">
                          {new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="px-5 py-4 text-[13px] font-bold text-[#1A1D20] text-right">${parseFloat(order.price).toFixed(2)}</td>
                        <td className="px-5 py-4 text-right">{statusPill(order.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <p className="text-[13px] text-[#6B7280]">
                Page {page} of {totalPages} · {total} orders
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center disabled:opacity-40 hover:bg-gray-50"
                >
                  <ChevronLeft className="w-4 h-4 text-[#1A1D20]" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center disabled:opacity-40 hover:bg-gray-50"
                >
                  <ChevronRight className="w-4 h-4 text-[#1A1D20]" />
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
