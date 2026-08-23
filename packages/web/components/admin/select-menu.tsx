"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectMenuProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
}

export default function SelectMenu({ value, onChange, options, placeholder = "Select...", disabled }: SelectMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-white border text-[14px] text-left transition-all disabled:opacity-60 ${
          open ? "border-[#FF561E] ring-2 ring-[#FF561E]/10" : "border-gray-200 hover:border-orange-200"
        }`}
      >
        <span className={selected ? "text-[#1A1D20] truncate" : "text-gray-400 truncate"}>{selected ? selected.label : placeholder}</span>
        <ChevronDown className={`w-4 h-4 text-[#6B7280] shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-40 mt-1.5 w-full max-h-64 overflow-auto rounded-xl bg-white border border-gray-100 shadow-lg py-1">
          {options.length === 0 ? (
            <p className="px-4 py-2 text-[13px] text-gray-400">No options</p>
          ) : (
            options.map((o) => {
              const active = o.value === value;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-4 py-2 text-left text-[13.5px] transition-colors ${
                    active ? "bg-[#FFF4F0] text-[#FF561E] font-semibold" : "text-[#1A1D20] hover:bg-[#FFF4F0] hover:text-[#FF561E]"
                  }`}
                >
                  <span className="truncate">{o.label}</span>
                  {active && <Check className="w-4 h-4 shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
