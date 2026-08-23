import Link from "next/link";
import { CheckCircle2, Clock, XCircle, RotateCcw, PauseCircle } from "lucide-react";
import Flag from "@/components/dashboard/flag";

export interface OrderSummary {
  id: number;
  bundle_name?: string;
  country?: string;
  country_code?: string;
  data_amount?: string;
  validity?: string;
  price: string;
  status: string;
  created_at: string;
}

function StatusBadge({ status }: { status: string }) {
  const base = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold";
  switch (status) {
    case "completed":
      return (
        <span className={`${base} bg-emerald-50 text-emerald-600`}>
          <CheckCircle2 className="w-3.5 h-3.5" /> Completed
        </span>
      );
    case "refunded":
      return (
        <span className={`${base} bg-blue-50 text-blue-600`}>
          <RotateCcw className="w-3.5 h-3.5" /> Refunded
        </span>
      );
    case "refund_failed":
      return (
        <span className={`${base} bg-red-50 text-red-500`}>
          <XCircle className="w-3.5 h-3.5" /> Refund Failed
        </span>
      );
    case "failed":
      return (
        <span className={`${base} bg-red-50 text-red-500`}>
          <XCircle className="w-3.5 h-3.5" /> Failed
        </span>
      );
    case "cancelled":
      return (
        <span className={`${base} bg-gray-100 text-[#6B7280]`}>
          <XCircle className="w-3.5 h-3.5" /> Cancelled
        </span>
      );
    case "pending_verification":
      return (
        <span className={`${base} bg-amber-50 text-amber-600`}>
          <Clock className="w-3.5 h-3.5" /> Pending Verification
        </span>
      );
    case "processing":
      return (
        <span className={`${base} bg-blue-50 text-blue-600`}>
          <Clock className="w-3.5 h-3.5" /> Processing
        </span>
      );
    case "on_hold":
      return (
        <span className={`${base} bg-gray-100 text-[#6B7280]`}>
          <PauseCircle className="w-3.5 h-3.5" /> On Hold
        </span>
      );
    case "rejected":
      return (
        <span className={`${base} bg-red-50 text-red-500`}>
          <XCircle className="w-3.5 h-3.5" /> Rejected
        </span>
      );
    default:
      return (
        <span className={`${base} bg-amber-50 text-amber-600`}>
          <Clock className="w-3.5 h-3.5" /> Pending
        </span>
      );
  }
}

export default function OrderCard({ order }: { order: OrderSummary }) {
  return (
    <Link
      href={`/dashboard/orders/${order.id}`}
      className="flex items-center justify-between px-5 py-4 bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:border-orange-100 hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-11 h-11 rounded-xl overflow-hidden border border-gray-100 shrink-0">
          <Flag code={order.country_code} className="w-full h-full" />
        </div>
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-[#1A1D20] truncate">
            {order.bundle_name || order.country || "eSIM Plan"}
          </p>
          <p className="text-[12px] text-[#6B7280]">
            {new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            {order.data_amount ? ` · ${order.data_amount}` : ""}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-[14px] font-bold text-[#1A1D20]">${parseFloat(order.price).toFixed(2)}</span>
        <StatusBadge status={order.status} />
      </div>
    </Link>
  );
}
