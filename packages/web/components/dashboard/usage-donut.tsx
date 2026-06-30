interface UsageDonutProps {
  usedMb: number;
  allocatedMb: number;
  unlimited?: boolean;
  size?: number;
  stroke?: number;
}

function mbToGb(mb: number): number {
  return Math.round((mb / 1024) * 100) / 100;
}

function fmtGb(mb: number): string {
  const gb = mbToGb(mb);
  return `${parseFloat(gb.toFixed(2))} GB`;
}

// Traffic-light colour based on how much data has been consumed.
// < 70% used = green, 70–90% = amber, > 90% = red.
function usageColor(consumedFraction: number): string {
  if (consumedFraction >= 0.9) return "#EF4444"; // red
  if (consumedFraction >= 0.7) return "#F59E0B"; // amber
  return "#10B981"; // green
}

export default function UsageDonut({ usedMb, allocatedMb, unlimited, size = 168, stroke = 16 }: UsageDonutProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const remainingMb = unlimited ? 0 : Math.max(0, allocatedMb - usedMb);
  const consumedFraction = unlimited || allocatedMb <= 0 ? 0 : Math.min(1, usedMb / allocatedMb);
  const remainingFraction = unlimited ? 1 : allocatedMb > 0 ? Math.min(1, remainingMb / allocatedMb) : 1;
  const dashOffset = circumference * (1 - remainingFraction);
  const arcColor = unlimited ? "#10B981" : usageColor(consumedFraction);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* consumed track (background) */}
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#ECE9E6" strokeWidth={stroke} />
        {/* remaining arc — colour reflects usage level */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={arcColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.4s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {unlimited ? (
          <>
            <span className="text-[30px] font-bold text-[#1A1D20] leading-none">&infin;</span>
            <span className="text-[12px] text-[#6B7280] mt-1">Unlimited</span>
          </>
        ) : (
          <>
            <span className="text-[26px] font-bold text-[#1A1D20] leading-none">{fmtGb(remainingMb)}</span>
            <span className="text-[12px] text-[#6B7280] mt-1">remaining</span>
          </>
        )}
      </div>
    </div>
  );
}

export { mbToGb, fmtGb };
