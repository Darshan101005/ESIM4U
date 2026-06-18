interface DataUsageProps {
  used: number;
  allocated: number;
  unit: string;
  unlimited?: boolean;
}

export default function DataUsage({ used, allocated, unit, unlimited }: DataUsageProps) {
  const percent = unlimited || allocated <= 0 ? 0 : Math.min(100, Math.round((used / allocated) * 100));
  const remaining = unlimited ? null : Math.max(0, Math.round((allocated - used) * 100) / 100);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] text-[#6B7280] font-medium">
          {unlimited ? "Unlimited data" : `${used} ${unit} used`}
        </span>
        {!unlimited && (
          <span className="text-[12px] font-semibold text-[#1A1D20]">
            {remaining} {unit} left
          </span>
        )}
      </div>
      <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#FF561E] to-[#FF7A45] transition-all duration-500"
          style={{ width: unlimited ? "100%" : `${percent}%` }}
        />
      </div>
    </div>
  );
}
