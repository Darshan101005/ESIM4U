import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
}

export default function StatCard({ label, value, icon: Icon, hint }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between mb-4">
        <div className="w-11 h-11 rounded-xl bg-[#FFF4F0] flex items-center justify-center">
          <Icon className="w-5 h-5 text-[#FF561E]" strokeWidth={2} />
        </div>
      </div>
      <p className="text-[13px] text-[#6B7280] font-medium mb-1">{label}</p>
      <p className="text-[28px] font-bold text-[#1A1D20]">{value}</p>
      {hint && <p className="text-[12px] text-[#6B7280] mt-1">{hint}</p>}
    </div>
  );
}
