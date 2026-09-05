"use client";

import DashboardTopbar from "@/components/dashboard/topbar";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Database, Clock, Calendar, Hash, XCircle, RotateCcw, Ban, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import QrDisplay from "@/components/dashboard/qr-display";
import UsageDonut from "@/components/dashboard/usage-donut";
import DataUnitToggle from "@/components/dashboard/data-unit-toggle";
import { formatData, toMb, type DataUnit } from "@/lib/data-units";
import Flag from "@/components/dashboard/flag";
import { CURRENCY_SYMBOLS } from "@/lib/fx";
import { isPaidStatus, isRetryable, amountLabel, statusLabel, statusPillClass } from "@/lib/order-status";

interface Order {
  id: number;
  bundle_name?: string;
  country?: string;
  country_code?: string;
  data_amount?: string;
  validity?: string;
  price: string;
  currency: string;
  display_currency?: string;
  display_rate?: string;
  order_reference: string;
  monty_order_id?: string;
  iccid?: string;
  qr_code_url?: string;
  lpa_code?: string;
  smdp_address?: string;
  matching_id?: string;
  bundle_expiry_date?: string;
  status: string;
  status_reason?: string;
  payment_method_type?: string;
  topup_of_order_id?: number;
  previous_order_reference?: string;
  created_at: string;
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

/** Notice banner text per status — accurate, never implies payment that didn't happen. */
const NOTICE: Record<string, { cls: string; text: string }> = {
  pending: {
    cls: "border-amber-100 bg-amber-50 text-amber-700",
    text: "Your payment hasn't been completed yet. You can retry the payment below, or cancel this order.",
  },
  processing: {
    cls: "border-blue-100 bg-blue-50 text-blue-700",
    text: "Payment received — your eSIM is being issued. This usually takes a few seconds, please refresh shortly.",
  },
  pending_verification: {
    cls: "border-amber-100 bg-amber-50 text-amber-700",
    text: "We're verifying your bank transfer. Your eSIM will appear here once it's approved, usually within a few hours.",
  },
  on_hold: {
    cls: "border-gray-100 bg-gray-50 text-[#6B7280]",
    text: "Your bank transfer is on hold while we check a few details. Please contact support for a quicker update.",
  },
  rejected: {
    cls: "border-red-100 bg-red-50 text-red-600",
    text: "We couldn't verify your bank transfer, so this order wasn't activated. Contact support if you believe this is a mistake.",
  },
  refunded: {
    cls: "border-blue-100 bg-blue-50 text-blue-700",
    text: "This order couldn't be completed, so your payment was refunded to your original payment method.",
  },
  refund_failed: {
    cls: "border-red-100 bg-red-50 text-red-600",
    text: "This order couldn't be completed and the automatic refund failed. Our team has been notified — please contact support.",
  },
  failed: {
    cls: "border-red-100 bg-red-50 text-red-600",
    text: "Your payment wasn't completed, so no eSIM was issued and you were not charged. You can retry the payment below.",
  },
  cancelled: {
    cls: "border-gray-100 bg-gray-50 text-[#6B7280]",
    text: "This order was cancelled. No eSIM was issued and you were not charged. You can start a new order below.",
  },
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [consumption, setConsumption] = useState<Consumption | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [dataUnit, setDataUnit] = useState<DataUnit>("MB");
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOrder(data.order);
      setConsumption(data.consumption);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  const runAction = async (action: "retry" | "cancel") => {
    setActing(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      if (data.redirect) {
        router.push(data.redirect);
        return;
      }
      toast.success("Order cancelled");
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <>
        <DashboardTopbar title="Order Details" />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#FF561E] animate-spin" />
        </div>
      </>
    );
  }

  if (notFound || !order) {
    return (
      <>
        <DashboardTopbar title="Order Details" />
        <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8 max-w-4xl mx-auto w-full">
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <XCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-[15px] text-[#6B7280] font-medium">Order not found</p>
          </div>
        </main>
      </>
    );
  }

  const isCompleted = order.status === "completed";
  const isTopup = Boolean(order.topup_of_order_id || order.previous_order_reference);
  const notice = NOTICE[order.status];

  // Locked amount in the currency the customer was quoted.
  const sym = CURRENCY_SYMBOLS[(order.display_currency as keyof typeof CURRENCY_SYMBOLS) || "USD"] ?? "$";
  const rate = order.display_rate != null ? Number(order.display_rate) : 1;
  const amountText = `${sym}${(Number(order.price) * rate).toFixed(2)}`;

  const validUntil = formatValidTill(consumption?.bundle_expiry_date || order.bundle_expiry_date);

  return (
    <>
      <DashboardTopbar title="Order Details" />
      <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#1A1D20]" />
          </button>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-9 rounded-md overflow-hidden border border-gray-100 shrink-0 relative">
              <Flag code={order.country_code} name={order.country} className="w-full h-full" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-[20px] font-bold text-[#1A1D20]">{order.bundle_name || order.country}</h2>
                <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusPillClass(order.status)}`}>
                  {statusLabel(order.status)}
                </span>
              </div>
              <p className="text-[12px] text-[#6B7280] font-mono">{order.order_reference}</p>
            </div>
          </div>
        </div>

        {isCompleted && isTopup ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <RefreshCw className="w-5 h-5 text-emerald-600" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-[#1A1D20]">Recharge applied</h3>
                <p className="text-[13.5px] text-[#6B7280] mt-1">
                  This plan was added to your existing eSIM — there&apos;s no new QR code and nothing to reinstall. It&apos;s
                  active on the same eSIM you already have.
                </p>
                {order.topup_of_order_id && (
                  <Link
                    href={`/dashboard/orders/${order.topup_of_order_id}`}
                    className="inline-flex items-center gap-1.5 mt-3 text-[13px] font-semibold text-[#FF561E] hover:text-[#E04B18]"
                  >
                    View the eSIM <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        ) : isCompleted ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 mb-6">
            <h3 className="text-[16px] font-bold text-[#1A1D20] mb-4">Install your eSIM</h3>
            <QrDisplay
              qrCodeUrl={order.qr_code_url}
              activationCode={order.lpa_code}
              smdpAddress={order.smdp_address}
              matchingId={order.matching_id}
            />
          </div>
        ) : (
          notice && (
            <div className={`rounded-2xl border p-6 mb-6 ${notice.cls}`}>
              <p className="text-[14px] font-medium">{notice.text}</p>
              {order.status_reason && (
                <p className="text-[12.5px] mt-1.5 opacity-80">Reason: {order.status_reason}</p>
              )}
            </div>
          )
        )}

        {/* Retry / cancel actions for non-delivered orders */}
        {(order.status === "pending" || isRetryable(order.status)) && !isCompleted && order.status !== "processing" && (
          <div className="flex flex-wrap gap-3 mb-6">
            {isRetryable(order.status) && (
              <button
                onClick={() => runAction("retry")}
                disabled={acting}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#FF561E] text-white text-[14px] font-bold hover:bg-[#E04B18] transition-colors shadow-sm shadow-orange-500/20 disabled:opacity-60"
              >
                {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                {order.status === "pending" ? "Retry Payment" : "Buy Again"}
              </button>
            )}
            {order.status === "pending" && (
              <button
                onClick={() => runAction("cancel")}
                disabled={acting}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-gray-200 text-[#6B7280] text-[14px] font-bold hover:text-[#1A1D20] hover:border-gray-300 transition-colors disabled:opacity-60"
              >
                <Ban className="w-4 h-4" /> Cancel Order
              </button>
            )}
          </div>
        )}

        {consumption && isCompleted && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 mb-6">
            <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
              <h3 className="text-[16px] font-bold text-[#1A1D20]">Data Usage</h3>
              <div className="flex items-center gap-2 flex-wrap">
                <DataUnitToggle unit={dataUnit} onChange={setDataUnit} />
                {consumption.plan_status && (
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${planTone(consumption.plan_status)}`}>
                    {consumption.plan_status}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
              <UsageDonut
                usedMb={toMb(consumption.data_used, consumption.data_unit)}
                allocatedMb={toMb(consumption.data_allocated, consumption.data_unit)}
                unlimited={consumption.unlimited}
                unit={dataUnit}
              />
              <div className="flex-1 w-full space-y-3">
                <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
                  <span className="text-[13px] text-[#6B7280]">Used</span>
                  <span className="text-[13.5px] font-bold text-[#1A1D20]">
                    {consumption.unlimited ? "—" : `${formatData(toMb(consumption.data_used, consumption.data_unit), dataUnit)} / ${formatData(toMb(consumption.data_allocated, consumption.data_unit), dataUnit)}`}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
                  <span className="text-[13px] text-[#6B7280]">Remaining</span>
                  <span className="text-[13.5px] font-bold text-[#1A1D20]">
                    {consumption.unlimited ? "Unlimited" : formatData(Math.max(0, toMb(consumption.data_allocated, consumption.data_unit) - toMb(consumption.data_used, consumption.data_unit)), dataUnit)}
                  </span>
                </div>
                {validUntil && (
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-[13px] text-[#6B7280]">eSIM Valid Until</span>
                    <span className="text-[13.5px] font-bold text-[#1A1D20]">{validUntil}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
          <h3 className="text-[16px] font-bold text-[#1A1D20] mb-4">Order Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {order.data_amount && <Detail icon={Database} label="Data" value={order.data_amount} />}
            {order.validity && <Detail icon={Clock} label="Validity" value={order.validity} />}
            <Detail
              icon={Calendar}
              label="Order Date"
              value={new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            />
            {order.iccid && <Detail icon={Hash} label="ICCID" value={order.iccid} mono />}
          </div>
          <div className="flex items-center justify-between pt-5 mt-5 border-t border-gray-100">
            <span className="text-[14px] font-semibold text-[#6B7280]">{amountLabel(order.status)}</span>
            <span className={`text-[20px] font-bold ${isPaidStatus(order.status) ? "text-[#FF561E]" : "text-[#1A1D20]"}`}>
              {amountText}
            </span>
          </div>
        </div>
      </main>
    </>
  );
}

function planTone(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("not started")) return "bg-amber-50 text-amber-600";
  if (s.includes("expired") || s.includes("finished") || s.includes("terminated")) return "bg-red-50 text-red-500";
  if (s.includes("active") || s.includes("started") || s.includes("progress")) return "bg-emerald-50 text-emerald-600";
  return "bg-gray-100 text-[#6B7280]";
}

function formatValidTill(raw?: string): string | null {
  if (!raw) return null;
  const d = new Date(raw.replace(" ", "T").slice(0, 19));
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function Detail({ icon: Icon, label, value, mono }: { icon: typeof Database; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-[#FFF4F0] flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-[#FF561E]" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="text-[12px] text-[#6B7280]">{label}</p>
        <p className={`text-[14px] font-bold text-[#1A1D20] truncate ${mono ? "font-mono text-[12px]" : ""}`}>{value}</p>
      </div>
    </div>
  );
}
