"use client";

import type { DataUnit } from "@/lib/data-units";

/**
 * Compact MB / GB segmented toggle. Data usage defaults to MB so small
 * consumption is always visible; the user can switch to GB when they prefer.
 */
export default function DataUnitToggle({
  unit,
  onChange,
}: {
  unit: DataUnit;
  onChange: (unit: DataUnit) => void;
}) {
  const units: DataUnit[] = ["MB", "GB"];
  return (
    <div className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 p-0.5" role="group" aria-label="Data unit">
      {units.map((u) => (
        <button
          key={u}
          type="button"
          onClick={() => onChange(u)}
          aria-pressed={unit === u}
          className={`px-2.5 py-1 rounded-md text-[12px] font-bold transition-colors ${
            unit === u ? "bg-white text-[#FF561E] shadow-sm" : "text-[#6B7280] hover:text-[#1A1D20]"
          }`}
        >
          {u}
        </button>
      ))}
    </div>
  );
}
