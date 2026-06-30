"use client";

import DashboardTopbar from "@/components/dashboard/topbar";
import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { Loader2, Smartphone, ChevronRight } from "lucide-react";
import Flag from "@/components/dashboard/flag";
import { Skeleton } from "@/components/dashboard/skeleton";

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

type EsimStatus = "active" | "not_started" | "expired" | "unknown";

const FILTERS: { key: "all" | EsimStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "not_started", label: "Plan Not Started" },
  { key: "expired", label: "Expired" },
];

function formatValidUntil(raw?: string): string {
  if (!raw) return "—";
  const d = new Date(raw.replace(" ", "T").slice(0, 19));
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function fromPlanStatus(planStatus: string): EsimStatus {
  const s = planStatus.toLowerCase();
  if (s.includes("not started")) return "not_started";
  if (s.includes("expired") || s.includes("finished") || s.includes("terminated")) return "expired";
  if (s.includes("active") || s.includes("started") || s.includes("progress")) return "active";
  return "unknown";
}

function fromExpiry(raw?: string): EsimStatus {
  if (!raw) return "unknown";
  const d = new Date(raw.replace(" ", "T").slice(0, 19));
  if (Number.isNaN(d.getTime())) return "unknown";
  return d.getTime() < Date.now() ? "expired" : "active";
}

const STATUS_META: Record<EsimStatus, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-emerald-50 text-emerald-600" },
  not_started: { label: "Plan Not Started", className: "bg-amber-50 text-amber-600" },
  expired: { label: "Expired", className: "bg-red-50 text-red-500" },
  unknown: { label: "Active", className: "bg-emerald-50 text-emerald-600" },
};

export default function EsimsPage() {
  const [orders, setOrders] = useState<EsimOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMap, setStatusMap] = useState<Record<number, EsimStatus>>({});
  const [statusesLoaded, setStatusesLoaded] = useState(false);
  const [filter, setFilter] = useState<"all" | EsimStatus>("all");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error();
      const data = await res.json();
      const completed: EsimOrder[] = (data.orders || []).filter((o: EsimOrder) => o.status === "completed");
      setOrders(completed);
      setLoading(false);

      // Live eSIM status per card
      const entries = await Promise.all(
        completed.map(async (o) => {
          try {
            const r = await fetch(`/api/orders/${o.id}`, { cache: "no-store" });
            const d = await r.json();
            const planStatus: string | undefined = d.consumption?.plan_status;
            const status = planStatus ? fromPlanStatus(planStatus) : fromExpiry(o.bundle_expiry_date);
            return [o.id, status === "unknown" ? fromExpiry(o.bundle_expiry_date) : status] as const;
          } catch {
            return [o.id, fromExpiry(o.bundle_expiry_date)] as const;
          }
        })
      );
      setStatusMap(Object.fromEntries(entries));
      setStatusesLoaded(true);
    } catch {
      setOrders([]);
      setLoading(false);
      setStatusesLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const c: Record<"all" | EsimStatus, number> = { all: orders.length, active: 0, not_started: 0, expired: 0, unknown: 0 };
    for (const o of orders) {
      const s = statusMap[o.id];
      if (!s) continue; // only count once the live status is known
      c[s === "unknown" ? "active" : s]++;
    }
    return c;
  }, [orders, statusMap]);

  const filtered = useMemo(() => {
    if (filter === "all") return orders;
    return orders.filter((o) => {
      const s = statusMap[o.id];
      if (!s) return false;
      return (s === "unknown" ? "active" : s) === filter;
    });
  }, [orders, filter, statusMap]);

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
          <>
            <div className="flex flex-wrap items-center gap-2 mb-5">
              {FILTERS.map((f) => {
                const active = filter === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold border transition-colors ${
                      active ? "bg-[#FFF4F0] text-[#FF561E] border-[#FF561E]" : "bg-white text-[#6B7280] border-gray-200 hover:text-[#FF561E] hover:border-orange-200"
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
                <p className="text-[14px] text-[#6B7280] font-medium">No eSIMs in this category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filtered.map((order) => {
                  const s = statusMap[order.id];
                  const meta = STATUS_META[s ?? "unknown"];
                  return (
                    <Link
                      key={order.id}
                      href={`/dashboard/orders/${order.id}`}
                      className="group bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 hover:border-orange-100 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-9 rounded-md overflow-hidden border border-gray-100 shrink-0 relative">
                            <Flag code={order.country_code} name={order.country} className="w-full h-full" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[15px] font-bold text-[#1A1D20] truncate">{order.bundle_name || order.country}</p>
                            <p className="text-[12px] text-[#6B7280]">{order.data_amount}{order.validity ? ` · ${order.validity}` : ""}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#FF561E] transition-colors shrink-0" />
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        {!s && !statusesLoaded ? (
                          <Skeleton className="h-[26px] w-28 rounded-full" />
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${meta.className}`}>
                            {meta.label}
                          </span>
                        )}
                        {order.bundle_expiry_date && (
                          <span className="text-[11px] text-[#6B7280] font-medium">Valid until {formatValidUntil(order.bundle_expiry_date)}</span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
