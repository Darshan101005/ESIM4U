"use client";

import AdminTopbar from "@/components/admin/admin-topbar";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, XCircle, Mail, Hash, Calendar, Database, Clock, CheckCircle2, Ban, RotateCcw, CreditCard, Info, ExternalLink, Receipt } from "lucide-react";
import toast from "react-hot-toast";
import QrDisplay from "@/components/dashboard/qr-display";
import UsageDonut, { fmtGb } from "@/components/dashboard/usage-donut";
import { CURRENCY_SYMBOLS } from "@/lib/fx";
import { isPaidStatus, statusLabel, statusPillClass } from "@/lib/order-status";
import { buildPaymentRows, type PaymentRow } from "@/lib/payment-details";
import { esimStatusTone } from "@/lib/esim-status";
import { CalendarClock } from "lucide-react";

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
  display_currency?: string;
  display_rate?: string;
  order_reference: string;
  monty_order_id?: string;
  iccid?: string;
  qr_code_url?: string;
  lpa_code?: string;
  smdp_address?: string;
  matching_id?: string;
  status: string;
  status_reason?: string;
  payment_method_type?: string;
  payment_source?: string;
  admin_updated_by?: string;
  created_at: string;
}

interface Consumption {
  data_allocated?: number;
  data_used?: number;
  data_remaining?: number;
  data_unit?: string;
  unlimited?: boolean;
  plan_status?: string;
  profile_status?: string;
  bundle_expiry_date?: string;
}

function formatValidTill(raw?: string): string | null {
  if (!raw) return null;
  const d = new Date(raw.replace(" ", "T").slice(0, 19));
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [consumption, setConsumption] = useState<Consumption | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, { cache: "no-store" });
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

  const setStatus = async (status: "completed" | "failed" | "cancelled") => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_status", status, note: note || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      toast.success(`Marked as ${statusLabel(status)}`);
      setNote("");
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  };

  const retryProvisioning = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "retry_provisioning" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Retry failed");
      if (data.order?.status === "completed") toast.success("eSIM provisioned successfully.");
      else toast.error("Provisioning failed again. Check the reason on the order.");
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Retry failed");
    } finally {
      setBusy(false);
    }
  };

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

  const paid = isPaidStatus(order.status);
  const cost = order.cost_price ? parseFloat(order.cost_price) : 0;
  const priceUsd = parseFloat(order.price);
  const margin = Math.round((priceUsd - cost) * 100) / 100;
  const isCompleted = order.status === "completed";

  const sym = CURRENCY_SYMBOLS[(order.display_currency as keyof typeof CURRENCY_SYMBOLS) || "USD"] ?? "$";
  const rate = order.display_rate != null ? Number(order.display_rate) : 1;
  const paidText = `${sym}${(priceUsd * rate).toFixed(2)}`;

  const paymentRows = buildPaymentRows(order, "admin");
  const canRetryProvision = !["pending", "cancelled", "rejected"].includes(order.status);

  return (
    <>
      <AdminTopbar title="Order Details" />
      <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#1A1D20]" />
          </button>
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

        {/* Money cards — labelled honestly by payment state */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5">
            <p className="text-[12px] text-[#6B7280] mb-1">Cost</p>
            <p className="text-[20px] font-bold text-[#1A1D20]">${cost.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5">
            <p className="text-[12px] text-[#6B7280] mb-1">{paid ? "Customer Paid" : "Order Value"}</p>
            <p className="text-[20px] font-bold text-[#1A1D20]">{paidText}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5">
            <p className="text-[12px] text-[#6B7280] mb-1">{paid ? "Margin" : "Potential Margin"}</p>
            <p className={`text-[20px] font-bold ${margin > 0 ? "text-emerald-600" : "text-[#1A1D20]"}`}>${margin.toFixed(2)}</p>
          </div>
        </div>

        {/* Admin controls */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 mb-6">
          <h3 className="text-[16px] font-bold text-[#1A1D20] mb-1">Manage Order</h3>
          <p className="text-[12.5px] text-[#6B7280] mb-4">
            Update the status manually or re-attempt eSIM provisioning. Changes are logged.
          </p>
          {order.status_reason && (
            <p className="text-[12.5px] text-[#6B7280] mb-4">
              <span className="font-semibold">Current reason:</span> {order.status_reason}
            </p>
          )}
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note / reason (saved with the status change)"
            rows={2}
            className="w-full px-3 py-2.5 rounded-xl bg-white border border-gray-200 outline-none focus:border-[#FF561E] focus:ring-2 focus:ring-[#FF561E]/10 text-[13px] transition-all resize-none mb-3"
          />
          <div className="flex flex-wrap gap-2">
            {order.status !== "completed" && (
              <button
                onClick={() => setStatus("completed")}
                disabled={busy}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-[13px] font-bold hover:bg-emerald-600 transition-colors disabled:opacity-60"
              >
                <CheckCircle2 className="w-4 h-4" /> Mark Completed
              </button>
            )}
            {order.status !== "failed" && (
              <button
                onClick={() => setStatus("failed")}
                disabled={busy}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-red-200 text-red-500 text-[13px] font-bold hover:bg-red-50 transition-colors disabled:opacity-60"
              >
                <XCircle className="w-4 h-4" /> Mark Failed
              </button>
            )}
            {order.status !== "cancelled" && (
              <button
                onClick={() => setStatus("cancelled")}
                disabled={busy}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-[#6B7280] text-[13px] font-bold hover:text-[#1A1D20] hover:border-gray-300 transition-colors disabled:opacity-60"
              >
                <Ban className="w-4 h-4" /> Mark Cancelled
              </button>
            )}
            {canRetryProvision && (
              <button
                onClick={retryProvisioning}
                disabled={busy}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF561E] text-white text-[13px] font-bold hover:bg-[#E04B18] transition-colors disabled:opacity-60"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />} Retry Provisioning
              </button>
            )}
          </div>
        </div>

        {/* Customer & order — only fields that exist */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 mb-6">
          <h3 className="text-[16px] font-bold text-[#1A1D20] mb-4">Customer & Order</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Detail icon={Mail} label="Customer" value={order.user_email} />
            <Detail icon={Calendar} label="Date" value={new Date(order.created_at).toLocaleString()} />
            {order.data_amount && <Detail icon={Database} label="Data" value={order.data_amount} />}
            {order.validity && <Detail icon={Clock} label="Validity" value={order.validity} />}
            {order.iccid && <Detail icon={Hash} label="ICCID" value={order.iccid} mono />}
            {order.monty_order_id && <Detail icon={Hash} label="MontyeSIM Order" value={order.monty_order_id} mono />}
          </div>
        </div>

        {/* Payment details — every applicable field, dynamic per method + status */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 mb-6">
          <h3 className="text-[16px] font-bold text-[#1A1D20] mb-4">Payment Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {paymentRows.map((r, i) => (
              <PaymentRowItem key={i} row={r} />
            ))}
          </div>
        </div>

        {isCompleted && (
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

        {consumption && isCompleted && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
              <h3 className="text-[16px] font-bold text-[#1A1D20]">Data Usage</h3>
              <div className="flex items-center gap-2 flex-wrap">
                {consumption.plan_status && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-[#6B7280]">{consumption.plan_status}</span>
                )}
                {(() => {
                  const est = esimStatusTone(consumption.profile_status);
                  return est ? (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${est.className}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${est.dot}`} /> eSIM {est.label}
                    </span>
                  ) : null;
                })()}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
              <UsageDonut usedMb={consumption.data_used ?? 0} allocatedMb={consumption.data_allocated ?? 0} unlimited={consumption.unlimited} />
              <div className="flex-1 w-full min-w-0 space-y-3">
                <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
                  <span className="flex items-center gap-2 text-[13px] text-[#6B7280]"><Database className="w-4 h-4 text-[#FF561E]" strokeWidth={2} /> Used</span>
                  <span className="text-[13.5px] font-bold text-[#1A1D20]">{consumption.unlimited ? "—" : `${fmtGb(consumption.data_used ?? 0)} / ${fmtGb(consumption.data_allocated ?? 0)}`}</span>
                </div>
                <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
                  <span className="flex items-center gap-2 text-[13px] text-[#6B7280]"><Database className="w-4 h-4 text-emerald-500" strokeWidth={2} /> Remaining</span>
                  <span className="text-[13.5px] font-bold text-[#1A1D20]">{consumption.unlimited ? "Unlimited" : fmtGb(Math.max(0, (consumption.data_allocated ?? 0) - (consumption.data_used ?? 0)))}</span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="flex items-center gap-2 text-[13px] text-[#6B7280]"><CalendarClock className="w-4 h-4 text-[#FF561E]" strokeWidth={2} /> Valid Until</span>
                  <span className="text-[13.5px] font-bold text-[#1A1D20]">{formatValidTill(consumption.bundle_expiry_date) || "—"}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

function iconForRow(row: PaymentRow) {
  if (row.href) return Receipt;
  if (row.label.includes("Method")) return CreditCard;
  if (row.label.includes("Refund")) return RotateCcw;
  if (row.label === "Reason") return Info;
  return Hash;
}

function PaymentRowItem({ row }: { row: PaymentRow }) {
  const Icon = iconForRow(row);
  const fullWidth = row.label === "Reason" || !!row.href;
  return (
    <div className={`flex items-center gap-3 ${fullWidth ? "sm:col-span-2" : ""}`}>
      <div className="w-9 h-9 rounded-lg bg-[#FFF4F0] flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-[#FF561E]" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="text-[12px] text-[#6B7280]">{row.label}</p>
        {row.href ? (
          <a
            href={row.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] font-bold text-[#FF561E] hover:text-[#E04B18] inline-flex items-center gap-1"
          >
            {row.value} <ExternalLink className="w-3.5 h-3.5" />
          </a>
        ) : (
          <p className={`text-[14px] font-bold text-[#1A1D20] truncate ${row.mono ? "font-mono text-[12px]" : ""}`}>{row.value}</p>
        )}
      </div>
    </div>
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
