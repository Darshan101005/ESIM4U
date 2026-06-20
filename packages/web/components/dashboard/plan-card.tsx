"use client";

import { ShoppingCart, Check, Loader2, Database, Clock, Wifi, Infinity as InfinityIcon } from "lucide-react";
import { useCurrency } from "@/lib/currency-context";

export interface PlanBundle {
  bundle_code: string;
  bundle_name: string;
  marketing_name: string;
  data_label: string;
  unlimited: boolean;
  validity_days: number;
  price: number;
  currency: string;
}

interface PlanCardProps {
  bundle: PlanBundle;
  added: boolean;
  adding: boolean;
  onAdd: (bundle: PlanBundle) => void;
}

export default function PlanCard({ bundle, added, adding, onAdd }: PlanCardProps) {
  const { format } = useCurrency();
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden hover:border-orange-100 hover:shadow-md transition-all duration-200">
      <div className="bg-gradient-to-r from-[#FF561E] to-[#FF7A45] px-5 py-4">
        <h3 className="text-white font-bold text-[16px] leading-tight">
          {bundle.data_label} · {bundle.validity_days} days
        </h3>
        <p className="text-white/80 text-[12px] font-medium mt-0.5">{bundle.marketing_name || bundle.bundle_name}</p>
      </div>
      <div className="p-5">
        <div className="space-y-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FFF4F0] flex items-center justify-center">
              {bundle.unlimited ? (
                <InfinityIcon className="w-4 h-4 text-[#FF561E]" strokeWidth={2} />
              ) : (
                <Database className="w-4 h-4 text-[#FF561E]" strokeWidth={2} />
              )}
            </div>
            <div>
              <p className="text-[12px] text-[#6B7280]">Data</p>
              <p className="text-[14px] font-bold text-[#1A1D20]">{bundle.data_label}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FFF4F0] flex items-center justify-center">
              <Clock className="w-4 h-4 text-[#FF561E]" strokeWidth={2} />
            </div>
            <div>
              <p className="text-[12px] text-[#6B7280]">Validity</p>
              <p className="text-[14px] font-bold text-[#1A1D20]">{bundle.validity_days} days</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FFF4F0] flex items-center justify-center">
              <Wifi className="w-4 h-4 text-[#FF561E]" strokeWidth={2} />
            </div>
            <div>
              <p className="text-[12px] text-[#6B7280]">Network</p>
              <p className="text-[14px] font-bold text-[#1A1D20]">4G / LTE</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div>
            <p className="text-[12px] text-[#6B7280]">Price</p>
            <p className="text-[22px] font-bold text-[#FF561E]">{format(bundle.price)}</p>
          </div>
          <button
            onClick={() => onAdd(bundle)}
            disabled={added || adding}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200 ${
              added
                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                : "bg-[#FF561E] text-white hover:bg-[#E04B18] shadow-sm shadow-orange-500/20"
            }`}
          >
            {adding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : added ? (
              <>
                <Check className="w-4 h-4" /> Added
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" /> Add to Cart
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
