"use client";

import DashboardTopbar from "@/components/dashboard/topbar";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Database, Clock, Calendar, Hash, XCircle } from "lucide-react";
import QrDisplay from "@/components/dashboard/qr-display";
import UsageDonut, { fmtGb } from "@/components/dashboard/usage-donut";
import Flag from "@/components/dashboard/flag";

interface Order {
  id: number;
  bundle_name?: string;
  country?: string;
  country_code?: string;
  data_amount?: string;
  validity?: string;
  price: string;
  currency: string;
  order_reference: string;
  monty_order_id?: string;
  iccid?: string;
  qr_code_url?: string;
  lpa_code?: string;
  smdp_address?: string;
  matching_id?: string;
  bundle_expiry_date?: string;
  status: string;
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

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [consumption, setConsumption] = useState<Consumption | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
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
        <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8">
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <XCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-[15px] text-[#6B7280] font-medium">Order not found</p>
          </div>
        </main>
      </>
    );
  }

  const isCompleted = order.status === "completed";

  const NOTICE: Record<string, { cls: string; text: string }> = {
    pending: {
      cls: "border-amber-100 bg-amber-50 text-amber-700",
      text: "Your payment is being processed. Your eSIM will appear here as soon as it's confirmed.",
    },
    processing: {
      cls: "border-amber-100 bg-amber-50 text-amber-700",
      text: "Payment confirmed — your eSIM is being issued. This usually takes a few seconds, please refresh shortly.",
    },
    refunded: {
      cls: "border-blue-100 bg-blue-50 text-blue-700",
      text: "This order could not be completed, so your payment has been refunded to your original payment method.",
    },
    refund_failed: {
      cls: "border-red-100 bg-red-50 text-red-600",
      text: "This order could not be completed and the automatic refund failed. Our team has been notified — please contact support.",
    },
    failed: {
      cls: "border-red-100 bg-red-50 text-red-600",
      text: "This order could not be completed. If you were charged, a refund will be issued. Please contact support if you need help.",
    },
    cancelled: {
      cls: "border-gray-100 bg-gray-50 text-[#6B7280]",
      text: "This checkout was not completed, so no eSIM was issued and no payment was taken.",
    },
  };
  const notice = NOTICE[order.status] || NOTICE.failed;

  return (
    <>
      <DashboardTopbar title="Order Details" />
      <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#1A1D20]" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-9 rounded-md overflow-hidden border border-gray-100 shrink-0 relative">
              <Flag code={order.country_code} name={order.country} className="w-full h-full" />
            </div>
            <div>
              <h2 className="text-[20px] font-bold text-[#1A1D20]">{order.bundle_name || order.country}</h2>
              <p className="text-[12px] text-[#6B7280] font-mono">{order.order_reference}</p>
            </div>
          </div>
        </div>

        {isCompleted ? (
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
          <div className={`rounded-2xl border p-6 mb-6 ${notice.cls}`}>
            <p className="text-[14px] font-medium">{notice.text}</p>
          </div>
        )}

        {consumption && isCompleted && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-bold text-[#1A1D20]">Data Usage</h3>
              {consumption.plan_status && (
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${planTone(consumption.plan_status)}`}>
                  {consumption.plan_status}
                </span>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
              <UsageDonut
                usedMb={consumption.data_used ?? 0}
                allocatedMb={consumption.data_allocated ?? 0}
                unlimited={consumption.unlimited}
              />
              <div className="flex-1 w-full space-y-3">
                <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
                  <span className="text-[13px] text-[#6B7280]">Used</span>
                  <span className="text-[13.5px] font-bold text-[#1A1D20]">
                    {consumption.unlimited ? "—" : `${fmtGb(consumption.data_used ?? 0)} / ${fmtGb(consumption.data_allocated ?? 0)}`}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
                  <span className="text-[13px] text-[#6B7280]">Remaining</span>
                  <span className="text-[13.5px] font-bold text-[#1A1D20]">
                    {consumption.unlimited ? "Unlimited" : fmtGb(Math.max(0, (consumption.data_allocated ?? 0) - (consumption.data_used ?? 0)))}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-[13px] text-[#6B7280]">eSIM Valid Until</span>
                  <span className="text-[13.5px] font-bold text-[#1A1D20]">{formatValidTill(consumption.bundle_expiry_date) || "—"}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
          <h3 className="text-[16px] font-bold text-[#1A1D20] mb-4">Order Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Detail icon={Database} label="Data" value={order.data_amount || "—"} />
            <Detail icon={Clock} label="Validity" value={order.validity || "—"} />
            <Detail icon={Calendar} label="Purchased" value={new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} />
            <Detail icon={Hash} label="ICCID" value={order.iccid || "—"} mono />
          </div>
          <div className="flex items-center justify-between pt-5 mt-5 border-t border-gray-100">
            <span className="text-[14px] font-semibold text-[#6B7280]">Amount Paid</span>
            <span className="text-[20px] font-bold text-[#FF561E]">${parseFloat(order.price).toFixed(2)}</span>
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
