"use client";

import AdminTopbar from "@/components/admin/admin-topbar";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, XCircle, Mail, Hash, Calendar, Database, Clock } from "lucide-react";
import QrDisplay from "@/components/dashboard/qr-display";
import DataUsage from "@/components/dashboard/data-usage";

interface Order {
  id: number;
  user_email: string;
  bundle_name?: string;
  country?: string;
  country_code?: string;
  data_amount?: string;
  validity?: string;
  price: string;
  cost_price?: string;
  currency: string;
  order_reference: string;
  monty_order_id?: string;
  iccid?: string;
  qr_code_url?: string;
  lpa_code?: string;
  smdp_address?: string;
  matching_id?: string;
  status: string;
  created_at: string;
}

interface Consumption {
  data_allocated?: number;
  data_used?: number;
  data_unit?: string;
  unlimited?: boolean;
  plan_status?: string;
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [consumption, setConsumption] = useState<Consumption | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOrder(data.order);
      setConsumption(data.consumption);
    } catch {
      setOrder(null);
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
        <AdminTopbar title="Order Details" />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#FF561E] animate-spin" />
        </div>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <AdminTopbar title="Order Details" />
        <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8">
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <XCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-[15px] text-[#6B7280] font-medium">Order not found</p>
          </div>
        </main>
      </>
    );
  }

  const cost = order.cost_price ? parseFloat(order.cost_price) : 0;
  const price = parseFloat(order.price);
  const margin = Math.round((price - cost) * 100) / 100;
  const isFailed = order.status === "failed";

  return (
    <>
      <AdminTopbar title="Order Details" />
      <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#1A1D20]" />
          </button>
          <div>
            <h2 className="text-[20px] font-bold text-[#1A1D20]">{order.bundle_name || order.country}</h2>
            <p className="text-[12px] text-[#6B7280] font-mono">{order.order_reference}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5">
            <p className="text-[12px] text-[#6B7280] mb-1">Cost</p>
            <p className="text-[20px] font-bold text-[#1A1D20]">${cost.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5">
            <p className="text-[12px] text-[#6B7280] mb-1">Customer Paid</p>
            <p className="text-[20px] font-bold text-[#1A1D20]">${price.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5">
            <p className="text-[12px] text-[#6B7280] mb-1">Margin</p>
            <p className={`text-[20px] font-bold ${margin > 0 ? "text-emerald-600" : "text-[#1A1D20]"}`}>${margin.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 mb-6">
          <h3 className="text-[16px] font-bold text-[#1A1D20] mb-4">Customer & Order</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Detail icon={Mail} label="Customer" value={order.user_email} />
            <Detail icon={Calendar} label="Date" value={new Date(order.created_at).toLocaleString()} />
            <Detail icon={Database} label="Data" value={order.data_amount || "—"} />
            <Detail icon={Clock} label="Validity" value={order.validity || "—"} />
            <Detail icon={Hash} label="ICCID" value={order.iccid || "—"} mono />
            <Detail icon={Hash} label="MontyeSIM Order" value={order.monty_order_id || "—"} mono />
          </div>
        </div>

        {!isFailed && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 mb-6">
            <h3 className="text-[16px] font-bold text-[#1A1D20] mb-4">eSIM Installation</h3>
            <QrDisplay
              qrCodeUrl={order.qr_code_url}
              activationCode={order.lpa_code}
              smdpAddress={order.smdp_address}
              matchingId={order.matching_id}
            />
          </div>
        )}

        {consumption && !isFailed && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
            <h3 className="text-[16px] font-bold text-[#1A1D20] mb-4">Data Usage</h3>
            <DataUsage
              used={consumption.data_used ?? 0}
              allocated={consumption.data_allocated ?? 0}
              unit={consumption.data_unit || "GB"}
              unlimited={consumption.unlimited}
            />
          </div>
        )}
      </main>
    </>
  );
}

function Detail({ icon: Icon, label, value, mono }: { icon: typeof Mail; label: string; value: string; mono?: boolean }) {
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
