"use client";

import { Trash2, Loader2, Wifi, Clock, RadioTower } from "lucide-react";
import Flag from "@/components/dashboard/flag";
import { useCurrency } from "@/lib/currency-context";
import type { CartItemData } from "@/lib/cart-context";

export type { CartItemData };

interface CartItemProps {
  item: CartItemData;
  removing: boolean;
  onRemove: (id: number) => void;
}

function Pill({ icon: Icon, children }: { icon: typeof Wifi; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-100 text-[11.5px] font-semibold text-[#374151]">
      <Icon className="w-3.5 h-3.5 text-[#FF561E]" strokeWidth={2} />
      {children}
    </span>
  );
}

export default function CartItem({ item, removing, onRemove }: CartItemProps) {
  const { format } = useCurrency();
  const title = item.bundle_name || item.country || "eSIM Plan";
  const showCountry = item.country && item.country !== title;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <div className="w-14 h-10 rounded-md overflow-hidden border border-gray-100 shrink-0 relative">
            <Flag code={item.country_code} name={item.country} className="w-full h-full" />
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-bold text-[#1A1D20] leading-tight truncate">{title}</p>
            {showCountry && <p className="text-[12.5px] text-[#6B7280] mt-0.5 truncate">{item.country}</p>}
            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              {item.data_amount && <Pill icon={Wifi}>{item.data_amount}</Pill>}
              {item.validity && <Pill icon={Clock}>{item.validity}</Pill>}
              <Pill icon={RadioTower}>4G / LTE</Pill>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3 shrink-0">
          <span className="text-[16px] font-bold text-[#1A1D20]">{format(parseFloat(item.price))}</span>
          <button
            onClick={() => onRemove(item.id)}
            disabled={removing}
            aria-label="Remove item"
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
    </div>
  );
}
