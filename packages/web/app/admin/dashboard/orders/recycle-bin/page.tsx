"use client";

import AdminTopbar from "@/components/admin/admin-topbar";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Loader2, Trash2, RotateCcw, ArrowLeft, UserX, Globe, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { CURRENCY_SYMBOLS } from "@/lib/fx";
import { statusLabel, statusPillClass } from "@/lib/order-status";

const TRASH_TTL_DAYS = 30;

interface TrashedOrder {
  id: number;
  user_email: string;
  bundle_name?: string;
  country?: string;
  price: string;
  display_currency?: string;
  display_rate?: string;
  status: string;
  deleted_scope: "admin" | "all";
  deleted_at: string;
  deleted_by?: string;
}

function daysLeft(deletedAt: string): number {
  const deleted = new Date(deletedAt).getTime();
  const elapsedDays = (Date.now() - deleted) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.ceil(TRASH_TTL_DAYS - elapsedDays));
}

function amount(o: TrashedOrder): string {
  const sym = CURRENCY_SYMBOLS[(o.display_currency as keyof typeof CURRENCY_SYMBOLS) || "USD"] ?? "$";
  const rate = o.display_rate ? Number(o.display_rate) : 1;
  return `${sym}${(Number(o.price) * rate).toFixed(2)}`;
}

export default function RecycleBinPage() {
  const [orders, setOrders] = useState<TrashedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [confirmPurge, setConfirmPurge] = useState<TrashedOrder | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders?deleted=1&limit=100`, { cache: "no-store" });
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

  const restore = async (id: number) => {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore" }),
      });
      if (!res.ok) throw new Error();
      toast.success("Order restored");
      await load();
    } catch {
      toast.error("Could not restore the order");
    } finally {
      setBusy(null);
    }
  };

  const purge = async (id: number) => {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "purge" }),
      });
      if (!res.ok) throw new Error();
      toast.success("Order permanently deleted");
      setConfirmPurge(null);
      await load();
    } catch {
      toast.error("Could not delete the order");
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <AdminTopbar title="Recycle Bin" />
      <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-2">
          <Link
            href="/admin/dashboard/orders"
            className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-[#1A1D20]" />
          </Link>
          <p className="text-[13px] text-[#6B7280]">Removed orders are kept here for {TRASH_TTL_DAYS} days, then deleted automatically.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#FF561E] animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 mt-4">
            <Trash2 className="w-12 h-12 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-[14px] text-[#6B7280] font-medium">The recycle bin is empty</p>
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {orders.map((o) => {
              const left = daysLeft(o.deleted_at);
              const isBusy = busy === o.id;
              return (
                <div key={o.id} className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[14px] font-bold text-[#1A1D20]">{o.bundle_name || o.country || "eSIM Plan"}</span>
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusPillClass(o.status)}`}>
                          {statusLabel(o.status)}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            o.deleted_scope === "all" ? "bg-red-50 text-red-500" : "bg-gray-100 text-[#6B7280]"
                          }`}
                        >
                          {o.deleted_scope === "all" ? <Globe className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                          {o.deleted_scope === "all" ? "Hidden everywhere" : "Hidden from admin"}
                        </span>
                      </div>
                      <p className="text-[12.5px] text-[#6B7280] mt-1">{o.user_email}</p>
                      <p className="text-[11.5px] text-[#9CA3AF] mt-0.5">
                        Removed {new Date(o.deleted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        {" · "}
                        {left > 0 ? `${left} day${left === 1 ? "" : "s"} left` : "deleting soon"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[15px] font-bold text-[#1A1D20]">{amount(o)}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-50">
                    <button
                      onClick={() => restore(o.id)}
                      disabled={isBusy}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-[13px] font-bold hover:bg-emerald-600 transition-colors disabled:opacity-60"
                    >
                      {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />} Restore
                    </button>
                    <button
                      onClick={() => setConfirmPurge(o)}
                      disabled={isBusy}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-red-200 text-red-500 text-[13px] font-bold hover:bg-red-50 transition-colors disabled:opacity-60"
                    >
                      <Trash2 className="w-4 h-4" /> Delete Permanently
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {confirmPurge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => busy === null && setConfirmPurge(null)} />
          <div className="relative bg-white rounded-2xl border border-gray-100 shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-[15px] font-bold text-[#1A1D20]">Delete permanently?</h3>
            <p className="text-[13px] text-[#6B7280] mt-1.5">
              This can&apos;t be undone. The order will be removed from the database for good.
            </p>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setConfirmPurge(null)}
                disabled={busy !== null}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-[#6B7280] text-[13px] font-bold hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={() => purge(confirmPurge.id)}
                disabled={busy !== null}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 text-white text-[13px] font-bold hover:bg-red-600 transition-colors disabled:opacity-60"
              >
                {busy !== null ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
