"use client";

import AdminTopbar from "@/components/admin/admin-topbar";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ShoppingBag, ChevronLeft, ChevronRight, Trash2, Trash, X, UserX, Globe } from "lucide-react";
import toast from "react-hot-toast";
import { statusLabel, statusPillClass } from "@/lib/order-status";

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
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusPillClass(status)}`}>
      {statusLabel(status)}
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
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
  const [deleting, setDeleting] = useState(false);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (status) params.set("status", status);
      const res = await fetch(`/api/admin/orders?${params.toString()}`, { cache: "no-store" });
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

  const removeOrder = async (scope: "admin" | "all") => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/orders/${deleteTarget.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "soft_delete", scope }),
      });
      if (!res.ok) throw new Error();
      toast.success(scope === "all" ? "Order moved to the Recycle Bin" : "Order hidden from the admin panel");
      setDeleteTarget(null);
      await load();
    } catch {
      toast.error("Could not remove the order");
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <>
      <AdminTopbar title="Orders" />
      <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8 max-w-6xl mx-auto w-full">
        <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
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
          <Link
            href="/admin/dashboard/orders/recycle-bin"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-[13px] font-semibold text-[#6B7280] hover:text-[#FF561E] hover:border-[#FF561E] transition-colors shrink-0"
          >
            <Trash className="w-4 h-4" /> Recycle Bin
          </Link>
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
                      <th className="px-5 py-3 w-10" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {orders.map((order) => (
                      <tr
                        key={order.id}
                        onClick={() => router.push(`/admin/dashboard/orders/${order.id}`)}
                        className="group hover:bg-gray-50/40 transition-colors cursor-pointer"
                      >
                        <td className="px-5 py-4 text-[13px] text-[#1A1D20] truncate max-w-[200px]">{order.user_email}</td>
                        <td className="px-5 py-4 text-[13px] font-semibold text-[#1A1D20]">{order.bundle_name || order.country || "eSIM Plan"}</td>
                        <td className="px-5 py-4 text-[13px] text-[#6B7280]">
                          {new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="px-5 py-4 text-[13px] font-bold text-[#1A1D20] text-right">${parseFloat(order.price).toFixed(2)}</td>
                        <td className="px-5 py-4 text-right">{statusPill(order.status)}</td>
                        <td className="px-3 py-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(order);
                            }}
                            title="Remove order"
                            className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-gray-100 hover:text-red-500 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
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

      {/* Remove-order choice modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !deleting && setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl border border-gray-100 shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-[15px] font-bold text-[#1A1D20]">Remove Order</h3>
              <button
                onClick={() => !deleting && setDeleteTarget(null)}
                className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200"
              >
                <X className="w-4 h-4 text-[#1A1D20]" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-[13px] text-[#6B7280] mb-1">
                {deleteTarget.bundle_name || deleteTarget.country || "eSIM Plan"} · {deleteTarget.user_email}
              </p>
              <p className="text-[13px] text-[#6B7280] mb-4">
                Choose how to remove this order. It moves to the Recycle Bin and can be restored within 30 days.
              </p>
              <div className="space-y-2.5">
                <button
                  onClick={() => removeOrder("admin")}
                  disabled={deleting}
                  className="w-full flex items-start gap-3 rounded-xl border border-gray-200 p-3.5 text-left hover:border-[#FF561E] hover:bg-[#FFF4F0]/40 transition-colors disabled:opacity-60"
                >
                  <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    <UserX className="w-4 h-4 text-[#6B7280]" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-[13.5px] font-bold text-[#1A1D20]">Remove from the admin panel only</p>
                    <p className="text-[12px] text-[#6B7280] mt-0.5">The customer will still see this order in their account.</p>
                  </div>
                </button>
                <button
                  onClick={() => removeOrder("all")}
                  disabled={deleting}
                  className="w-full flex items-start gap-3 rounded-xl border border-gray-200 p-3.5 text-left hover:border-red-300 hover:bg-red-50/40 transition-colors disabled:opacity-60"
                >
                  <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4 text-red-500" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-[13.5px] font-bold text-[#1A1D20]">Remove everywhere</p>
                    <p className="text-[12px] text-[#6B7280] mt-0.5">Hidden from the admin panel and from the customer.</p>
                  </div>
                </button>
              </div>
              {deleting && (
                <div className="flex items-center justify-center gap-2 mt-4 text-[12.5px] text-[#6B7280]">
                  <Loader2 className="w-4 h-4 animate-spin" /> Removing...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
