"use client";

import DashboardTopbar from "@/components/dashboard/topbar";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Database, Clock, Calendar, Hash, XCircle } from "lucide-react";
import QrDisplay from "@/components/dashboard/qr-display";
import DataUsage from "@/components/dashboard/data-usage";
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

  const isFailed = order.status === "failed";

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
            <div className="w-11 h-11 rounded-xl overflow-hidden border border-gray-100">
              <Flag code={order.country_code} className="w-full h-full" />
            </div>
            <div>
              <h2 className="text-[20px] font-bold text-[#1A1D20]">{order.bundle_name || order.country}</h2>
              <p className="text-[12px] text-[#6B7280] font-mono">{order.order_reference}</p>
            </div>
          </div>
        </div>

        {isFailed ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-6 mb-6">
            <p className="text-[14px] text-red-600 font-medium">
              This order could not be completed and no charge was applied. Please try again from Browse.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 mb-6">
            <h3 className="text-[16px] font-bold text-[#1A1D20] mb-4">Install your eSIM</h3>
            <QrDisplay
              qrCodeUrl={order.qr_code_url}
              activationCode={order.lpa_code}
              smdpAddress={order.smdp_address}
              matchingId={order.matching_id}
            />
          </div>
        )}

        {consumption && !isFailed && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-bold text-[#1A1D20]">Data Usage</h3>
              {consumption.plan_status && (
                <span className="px-2.5 py-1 rounded-full bg-[#FFF4F0] text-[#FF561E] text-[11px] font-semibold">
                  {consumption.plan_status}
                </span>
              )}
            </div>
            <DataUsage
              used={consumption.data_used ?? 0}
              allocated={consumption.data_allocated ?? 0}
              unit={consumption.data_unit || "GB"}
              unlimited={consumption.unlimited}
            />
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
