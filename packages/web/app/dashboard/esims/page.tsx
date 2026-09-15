"use client";

import DashboardTopbar from "@/components/dashboard/topbar";
import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Smartphone, ChevronRight, RefreshCw, X, Database, Clock, Plus, Ban, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import Flag from "@/components/dashboard/flag";
import { Skeleton } from "@/components/dashboard/skeleton";
import { useCart } from "@/lib/cart-context";
import { useCurrency } from "@/lib/currency-context";
import { esimStatusTone } from "@/lib/esim-status";

interface EsimOrder {
  id: number;
  bundle_code?: string;
  bundle_name?: string;
  country?: string;
  country_code?: string;
  data_amount?: string;
  validity?: string;
  status: string;
  iccid?: string;
  order_reference?: string;
  monty_order_id?: string;
  bundle_expiry_date?: string;
  created_at: string;
}

interface TopupBundle {
  bundle_code: string;
  bundle_name: string;
  marketing_name: string;
  primary_country_code: string;
  primary_country_name: string;
  data_label: string;
  validity_days: number;
  price: number;
  cost_price: number;
}

type EsimStatus = "active" | "not_started" | "expired" | "unknown";

/** A deleted/released eSIM profile can't be reused — no recharge possible. */
function isDeletedProfile(profileStatus?: string): boolean {
  if (!profileStatus) return false;
  const s = profileStatus.toLowerCase();
  return s.includes("delete") || s.includes("release");
}

// Each eSIM is tagged by BOTH its plan lifecycle and its eSIM (profile)
// lifecycle, and appears under every filter it matches — so a plan-not-started
// eSIM that was deleted shows under both "Plan Not Started" and "Deleted".
const PLAN_TAG: Record<EsimStatus, { key: string; label: string }> = {
  active: { key: "plan:active", label: "Active" },
  not_started: { key: "plan:not_started", label: "Plan Not Started" },
  expired: { key: "plan:expired", label: "Expired" },
  unknown: { key: "plan:active", label: "Active" },
};

/** Maps a MontyeSIM profile_status to an eSIM-lifecycle filter tag. */
function stateTag(profileStatus?: string): { key: string; label: string } | null {
  if (!profileStatus) return null;
  const s = profileStatus.toLowerCase();
  if (s.includes("delete") || s.includes("terminat")) return { key: "state:deleted", label: "Deleted" };
  if (s.includes("release")) return { key: "state:released", label: "Released" };
  if (s.includes("disable")) return { key: "state:disabled", label: "Disabled" };
  if (s.includes("download") || s.includes("install")) return { key: "state:installed", label: "Installed" };
  if (s.includes("enable") || s.includes("active")) return { key: "state:enabled", label: "Enabled" };
  return { key: `state:${s}`, label: profileStatus }; // surface any other live state verbatim
}

// Filter set. `always: true` chips are shown for every user (0 when none apply).
// `always: false` chips (Installed / Released) only appear when an eSIM actually
// has that state, so they don't clutter the bar when not applicable.
const FILTER_DEFS: { key: string; label: string; always: boolean }[] = [
  { key: "all", label: "All", always: true },
  { key: "plan:active", label: "Active", always: true },
  { key: "plan:not_started", label: "Plan Not Started", always: true },
  { key: "plan:expired", label: "Expired", always: true },
  { key: "state:enabled", label: "Enabled", always: true },
  { key: "state:installed", label: "Installed", always: false },
  { key: "state:disabled", label: "Disabled", always: true },
  { key: "state:released", label: "Released", always: false },
  { key: "state:deleted", label: "Deleted", always: true },
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

interface EsimLive {
  plan: EsimStatus; // plan lifecycle for the pill
  profileStatus?: string; // raw MontyeSIM eSIM lifecycle (Enabled/Deleted/Released…)
  tags: { key: string; label: string }[]; // every filter this eSIM matches
}

export default function EsimsPage() {
  const router = useRouter();
  const { addToCart } = useCart();
  const { format } = useCurrency();
  const [orders, setOrders] = useState<EsimOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMap, setStatusMap] = useState<Record<number, EsimLive>>({});
  const [statusesLoaded, setStatusesLoaded] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [deletedWarnOpen, setDeletedWarnOpen] = useState(false);

  // Recharge / renew modal state.
  const [rechargeOrder, setRechargeOrder] = useState<EsimOrder | null>(null);
  const [topups, setTopups] = useState<TopupBundle[] | null>(null);
  const [topupsLoading, setTopupsLoading] = useState(false);
  const [addingCode, setAddingCode] = useState<string | null>(null);

  const openRecharge = async (order: EsimOrder) => {
    if (!order.bundle_code || !order.monty_order_id || !order.order_reference) {
      toast.error("This eSIM can't be recharged.");
      return;
    }
    setRechargeOrder(order);
    setTopups(null);
    setTopupsLoading(true);
    try {
      const params = new URLSearchParams({ bundle_code: order.bundle_code });
      if (order.country_code) params.set("country_code", order.country_code);
      const res = await fetch(`/api/montyesim/topups?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load recharge plans");
      setTopups(data.bundles || []);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not load recharge plans");
      setTopups([]);
    } finally {
      setTopupsLoading(false);
    }
  };

  const rechargeWith = async (b: TopupBundle) => {
    if (!rechargeOrder) return;
    setAddingCode(b.bundle_code);
    try {
      const result = await addToCart({
        bundle_code: b.bundle_code,
        bundle_name: b.marketing_name || b.bundle_name,
        country: b.primary_country_name || rechargeOrder.country,
        country_code: b.primary_country_code || rechargeOrder.country_code,
        data_amount: b.data_label,
        validity: b.validity_days ? `${b.validity_days} days` : undefined,
        price: b.price,
        cost_price: b.cost_price,
        currency: "USD",
        topup_of_order_id: rechargeOrder.id,
        previous_order_reference: rechargeOrder.order_reference,
        previous_monty_order_id: rechargeOrder.monty_order_id,
      });
      if (result === "error") {
        toast.error("Could not add the plan. Please try again.");
        return;
      }
      if (result === "exists") toast("This recharge is already in your cart.");
      else toast.success("Recharge added to cart.");
      setRechargeOrder(null);
      router.push("/dashboard/checkout");
    } finally {
      setAddingCode(null);
    }
  };

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error();
      const data = await res.json();
      const completed: EsimOrder[] = (data.orders || []).filter((o: EsimOrder) => o.status === "completed");
      setOrders(completed);
      setLoading(false);

      // Live eSIM status per card (plan lifecycle + eSIM profile lifecycle)
      const entries = await Promise.all(
        completed.map(async (o) => {
          try {
            const r = await fetch(`/api/orders/${o.id}`, { cache: "no-store" });
            const d = await r.json();
            const planStatus: string | undefined = d.consumption?.plan_status;
            const profileStatus: string | undefined = d.consumption?.profile_status;
            let plan = planStatus ? fromPlanStatus(planStatus) : fromExpiry(o.bundle_expiry_date);
            if (plan === "unknown") plan = fromExpiry(o.bundle_expiry_date);
            const tags = [PLAN_TAG[plan]];
            const st = stateTag(profileStatus);
            if (st) tags.push(st);
            return [o.id, { plan, profileStatus, tags }] as const;
          } catch {
            const plan = fromExpiry(o.bundle_expiry_date);
            return [o.id, { plan, tags: [PLAN_TAG[plan]] }] as const;
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

  // Build the chip list from whatever plan/eSIM states are actually present,
  // plus per-tag counts. An eSIM counts under every tag it carries.
  const { availableFilters, counts } = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length };
    const labelMap: Record<string, string> = {};
    for (const o of orders) {
      const live = statusMap[o.id];
      if (!live) continue;
      for (const t of live.tags) {
        counts[t.key] = (counts[t.key] || 0) + 1;
        labelMap[t.key] = t.label;
      }
    }
    // Always-on chips plus the conditional ones (Installed/Released) only when
    // present, plus any extra live state we didn't predefine so nothing hides.
    const known = FILTER_DEFS.filter((f) => f.always || (counts[f.key] ?? 0) > 0).map(({ key, label }) => ({ key, label }));
    const extras = Object.keys(labelMap)
      .filter((k) => !FILTER_DEFS.some((f) => f.key === k))
      .sort()
      .map((k) => ({ key: k, label: labelMap[k] }));
    const availableFilters = [...known, ...extras];
    return { availableFilters, counts };
  }, [orders, statusMap]);

  const filtered = useMemo(() => {
    if (filter === "all") return orders;
    return orders.filter((o) => statusMap[o.id]?.tags.some((t) => t.key === filter));
  }, [orders, filter, statusMap]);

  return (
    <>
      <DashboardTopbar title="My eSIMs" />
      <main className="flex-1 px-4 lg:px-16 xl:px-24 py-6 lg:py-8 max-w-6xl mx-auto w-full">
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
              {availableFilters.map((f) => {
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
                    <span className={`text-[11px] font-bold ${active ? "text-[#FF561E]/70" : "text-gray-400"}`}>{counts[f.key] ?? 0}</span>
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
                  const meta = STATUS_META[s?.plan ?? "unknown"];
                  const est = esimStatusTone(s?.profileStatus);
                  const isDeleted = isDeletedProfile(s?.profileStatus);
                  return (
                    <div
                      key={order.id}
                      onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                      className="group bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 hover:border-orange-100 hover:shadow-md transition-all duration-200 cursor-pointer"
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
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100 gap-2">
                        {!s && !statusesLoaded ? (
                          <Skeleton className="h-[26px] w-28 rounded-full" />
                        ) : (
                          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${meta.className}`}>
                              {meta.label}
                            </span>
                            {est && (
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${est.className}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${est.dot}`} /> eSIM {est.label}
                              </span>
                            )}
                          </div>
                        )}
                        {order.bundle_expiry_date && (
                          <span className="text-[11px] text-[#6B7280] font-medium shrink-0">Valid until {formatValidUntil(order.bundle_expiry_date)}</span>
                        )}
                      </div>
                      {isDeleted ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletedWarnOpen(true);
                          }}
                          className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 text-[#9CA3AF] text-[13px] font-bold cursor-not-allowed"
                          title="This eSIM is deleted and can't be recharged"
                        >
                          <Ban className="w-4 h-4" /> Recharge unavailable
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openRecharge(order);
                          }}
                          className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#FFF4F0] text-[#FF561E] text-[13px] font-bold hover:bg-[#FFE7DC] transition-colors"
                        >
                          <RefreshCw className="w-4 h-4" /> Recharge
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {rechargeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !addingCode && setRechargeOrder(null)} />
          <div className="relative bg-white rounded-2xl border border-gray-100 shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <div className="min-w-0">
                <h3 className="text-[15px] font-bold text-[#1A1D20]">Recharge eSIM</h3>
                <p className="text-[12px] text-[#6B7280] truncate">
                  {rechargeOrder.bundle_name || rechargeOrder.country} · same eSIM, new plan
                </p>
              </div>
              <button
                onClick={() => !addingCode && setRechargeOrder(null)}
                className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 shrink-0"
              >
                <X className="w-4 h-4 text-[#1A1D20]" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-[12px] text-[#6B7280] mb-4">
                Pick a plan to add to your existing eSIM. No reinstall needed — it activates on the same eSIM.
              </p>
              {topupsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 text-[#FF561E] animate-spin" />
                </div>
              ) : !topups || topups.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[13px] text-[#6B7280] font-medium">No recharge plans are available for this eSIM right now.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {topups.map((b) => (
                    <div key={b.bundle_code} className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 p-3.5">
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-bold text-[#1A1D20] truncate">{b.marketing_name || b.bundle_name}</p>
                        <div className="flex items-center gap-3 mt-1 text-[11.5px] text-[#6B7280]">
                          <span className="inline-flex items-center gap-1">
                            <Database className="w-3.5 h-3.5 text-[#FF561E]" /> {b.data_label}
                          </span>
                          {b.validity_days > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-[#FF561E]" /> {b.validity_days} days
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[14px] font-bold text-[#1A1D20]">{format(b.price)}</span>
                        <button
                          onClick={() => rechargeWith(b)}
                          disabled={addingCode !== null}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#FF561E] text-white text-[12.5px] font-bold hover:bg-[#E04B18] transition-colors disabled:opacity-60"
                        >
                          {addingCode === b.bundle_code ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                          Recharge
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Deleted eSIM — recharge not possible */}
      {deletedWarnOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeletedWarnOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-red-500" strokeWidth={2} />
            </div>
            <h3 className="text-[17px] font-bold text-[#1A1D20]">This eSIM has been deleted</h3>
            <p className="text-[13.5px] text-[#6B7280] leading-relaxed mt-2">
              A deleted eSIM is permanently removed and can&apos;t be recharged, reinstalled, or used again. To reconnect,
              please purchase a new eSIM.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <button
                onClick={() => {
                  setDeletedWarnOpen(false);
                  router.push("/dashboard/browse");
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#FF561E] text-white text-[13px] font-bold hover:bg-[#E04B18] transition-colors"
              >
                Browse eSIM plans
              </button>
              <button
                onClick={() => setDeletedWarnOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-[13px] font-semibold text-[#6B7280] hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
