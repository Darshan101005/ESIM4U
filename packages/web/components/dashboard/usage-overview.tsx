"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, RefreshCw, Loader2, CalendarClock, Database, ArrowRight, Smartphone } from "lucide-react";
import UsageDonut, { fmtGb } from "@/components/dashboard/usage-donut";

interface UsageOrder {
  id: number;
  bundle_name?: string;
  country?: string;
  data_amount?: string;
}

interface Consumption {
  data_allocated?: number;
  data_used?: number;
  data_remaining?: number;
  data_unit?: string;
  unlimited?: boolean;
  plan_status?: string;
  bundle_expiry_date?: string;
}

function formatValidTill(raw?: string): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(" ", "T").slice(0, 19);
  const d = new Date(cleaned);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function statusTone(status?: string): { label: string; className: string } {
  const s = (status || "").toLowerCase();
  if (s.includes("not started")) return { label: status || "Plan Not Started", className: "bg-amber-50 text-amber-600" };
  if (s.includes("expired") || s.includes("finished") || s.includes("terminated")) return { label: status || "Expired", className: "bg-red-50 text-red-500" };
  if (s.includes("active") || s.includes("started") || s.includes("progress")) return { label: status || "Active", className: "bg-emerald-50 text-emerald-600" };
  return { label: status || "Unknown", className: "bg-gray-100 text-[#6B7280]" };
}

export default function UsageOverview({ orders }: { orders: UsageOrder[] }) {
  const [selectedId, setSelectedId] = useState<number | null>(orders[0]?.id ?? null);
  const [consumption, setConsumption] = useState<Consumption | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const cache = useRef<Map<number, Consumption | null>>(new Map());

  const load = useCallback(async (id: number, force = false) => {
    if (!force && cache.current.has(id)) {
      setConsumption(cache.current.get(id) ?? null);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/orders/${id}`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      cache.current.set(id, data.consumption ?? null);
      setConsumption(data.consumption ?? null);
    } catch {
      setError(true);
      setConsumption(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId != null) load(selectedId);
  }, [selectedId, load]);

  const selected = orders.find((o) => o.id === selectedId);
  const allocated = consumption?.data_allocated ?? 0;
  const used = consumption?.data_used ?? 0;
  const unlimited = consumption?.unlimited;
  const validTill = formatValidTill(consumption?.bundle_expiry_date);
  const tone = statusTone(consumption?.plan_status);

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
        <h3 className="text-[16px] font-bold text-[#1A1D20] mb-4">Data Usage Overview</h3>
        <div className="py-10 text-center">
          <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
            <Smartphone className="w-6 h-6 text-gray-300" strokeWidth={1.5} />
          </div>
          <p className="text-[15px] font-semibold text-[#1A1D20]">No active eSIMs</p>
          <p className="text-[13px] text-[#6B7280] mt-1 mb-4">Purchase an eSIM plan to track your data usage here.</p>
          <Link href="/dashboard/browse" className="inline-flex px-5 py-2.5 rounded-xl border border-[#FF561E]/40 text-[#FF561E] text-[13px] font-bold hover:bg-[#FF561E] hover:text-white transition-colors">
            Browse eSIM Plans
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <h3 className="text-[16px] font-bold text-[#1A1D20]">Data Usage Overview</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={selectedId ?? ""}
              onChange={(e) => setSelectedId(Number(e.target.value))}
              className="appearance-none pl-3.5 pr-9 py-2 rounded-xl border border-gray-200 bg-white text-[13px] font-semibold text-[#1A1D20] outline-none focus:border-[#FF561E] focus:ring-2 focus:ring-[#FF561E]/10 transition-all cursor-pointer max-w-[220px] truncate"
            >
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {(o.bundle_name || o.country || "eSIM")}{o.data_amount ? ` · ${o.data_amount}` : ""}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[#6B7280] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <button
            onClick={() => selectedId != null && load(selectedId, true)}
            disabled={loading}
            title="Refresh usage"
            className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-[#6B7280] hover:text-[#FF561E] hover:border-orange-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-14">
          <Loader2 className="w-7 h-7 text-[#FF561E] animate-spin" />
        </div>
      ) : error || !consumption ? (
        <div className="py-12 text-center">
          <p className="text-[14px] font-semibold text-[#1A1D20]">Usage data unavailable</p>
          <p className="text-[12.5px] text-[#6B7280] mt-1">We couldn&apos;t load live usage for this eSIM right now.</p>
          <button onClick={() => selectedId != null && load(selectedId, true)} className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#FF561E]">
            <RefreshCw className="w-3.5 h-3.5" /> Try again
          </button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
          <UsageDonut usedMb={used} allocatedMb={allocated} unlimited={unlimited} />

          <div className="flex-1 w-full min-w-0">
            <div className="flex items-center gap-2 mb-4">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${tone.className}`}>
                {tone.label}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
                <span className="flex items-center gap-2 text-[13px] text-[#6B7280]">
                  <Database className="w-4 h-4 text-[#FF561E]" strokeWidth={2} /> Used
                </span>
                <span className="text-[13.5px] font-bold text-[#1A1D20]">
                  {unlimited ? "—" : `${fmtGb(used)} / ${fmtGb(allocated)}`}
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
                <span className="flex items-center gap-2 text-[13px] text-[#6B7280]">
                  <Database className="w-4 h-4 text-emerald-500" strokeWidth={2} /> Remaining
                </span>
                <span className="text-[13.5px] font-bold text-[#1A1D20]">
                  {unlimited ? "Unlimited" : fmtGb(Math.max(0, allocated - used))}
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="flex items-center gap-2 text-[13px] text-[#6B7280]">
                  <CalendarClock className="w-4 h-4 text-[#FF561E]" strokeWidth={2} /> eSIM Valid Until
                </span>
                <span className="text-[13.5px] font-bold text-[#1A1D20]">{validTill || "—"}</span>
              </div>
            </div>

            {selected && (
              <Link href={`/dashboard/orders/${selected.id}`} className="inline-flex items-center gap-1.5 mt-4 text-[13px] font-semibold text-[#FF561E] hover:text-[#E04B18]">
                View Details <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
