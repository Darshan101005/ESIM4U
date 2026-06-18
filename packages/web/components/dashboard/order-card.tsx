import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
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
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-semibold">
        <CheckCircle2 className="w-3.5 h-3.5" /> Active
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-500 text-[11px] font-semibold">
        <XCircle className="w-3.5 h-3.5" /> Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 text-[11px] font-semibold">
      <Clock className="w-3.5 h-3.5" /> Pending
    </span>
  );
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
