"use client";

import { Trash2, Loader2, Database, Clock } from "lucide-react";
import Flag from "@/components/dashboard/flag";

export interface CartItemData {
  id: number;
  bundle_code: string;
  bundle_name?: string;
  country?: string;
  country_code?: string;
  data_amount?: string;
  validity?: string;
  price: string;
  currency: string;
}

interface CartItemProps {
  item: CartItemData;
  removing: boolean;
  onRemove: (id: number) => void;
}

export default function CartItem({ item, removing, onRemove }: CartItemProps) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4 bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-11 h-11 rounded-xl overflow-hidden border border-gray-100 shrink-0">
          <Flag code={item.country_code} className="w-full h-full" />
        </div>
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-[#1A1D20] truncate">{item.bundle_name || item.country}</p>
          <div className="flex items-center gap-3 mt-0.5">
            {item.data_amount && (
              <span className="inline-flex items-center gap-1 text-[12px] text-[#6B7280]">
                <Database className="w-3.5 h-3.5" /> {item.data_amount}
              </span>
            )}
            {item.validity && (
              <span className="inline-flex items-center gap-1 text-[12px] text-[#6B7280]">
                <Clock className="w-3.5 h-3.5" /> {item.validity}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <span className="text-[15px] font-bold text-[#1A1D20]">${parseFloat(item.price).toFixed(2)}</span>
        <button
          onClick={() => onRemove(item.id)}
          disabled={removing}
          className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center hover:bg-red-50 hover:border-red-100 transition-colors"
        >
          {removing ? (
            <Loader2 className="w-4 h-4 text-[#6B7280] animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4 text-[#6B7280]" />
          )}
        </button>
      </div>
    </div>
  );
}
