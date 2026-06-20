"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { useCurrency } from "@/lib/currency-context";
import { SUPPORTED_CURRENCIES, CURRENCY_SYMBOLS } from "@/lib/fx";

export default function CurrencyDropdown() {
  const { currency, setCurrency, error } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => !error && setOpen((o) => !o)}
        disabled={error}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-gray-200 hover:border-orange-200 hover:bg-[#FFF4F0] transition-colors disabled:opacity-50"
        title={error ? "Live rates unavailable" : "Display currency"}
      >
        <span className="text-[13px] font-bold text-[#1A1D20]">{currency}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-[#6B7280] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.12)] py-1.5 z-50">
          {SUPPORTED_CURRENCIES.map((c) => (
            <button
              key={c}
              onClick={() => {
                setCurrency(c);
                setOpen(false);
              }}
              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#FFF4F0] transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <span className="w-6 text-[14px] font-bold text-[#FF561E]">{CURRENCY_SYMBOLS[c]}</span>
                <span className="text-[13px] font-medium text-[#1A1D20]">{c}</span>
              </span>
              {currency === c && <Check className="w-4 h-4 text-[#FF561E]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
