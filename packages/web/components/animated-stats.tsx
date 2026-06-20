"use client";

import { useEffect, useState } from "react";
import { Smartphone, Users, Globe, LucideIcon } from "lucide-react";

interface Stat {
  icon: LucideIcon;
  target: number;
  suffix: string;
  label: string;
}

const stats: Stat[] = [
  { icon: Smartphone, target: 50, suffix: "k", label: "Total eSIM" },
  { icon: Users, target: 35, suffix: "k", label: "SIM User" },
  { icon: Globe, target: 190, suffix: "+", label: "Countries" },
];

function easeOutCubic(progress: number): number {
  return 1 - Math.pow(1 - progress, 3);
}

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(() => Math.max(1, Math.round(easeOutCubic(1 / 60) * target)));

  useEffect(() => {
    let frame = 0;
    const startTime = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      setValue(Math.max(1, Math.round(easeOutCubic(progress) * target)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}

function StatItem({ stat }: { stat: Stat }) {
  const value = useCountUp(stat.target);
  return (
    <div className="flex items-center gap-3">
      <stat.icon className="w-7 h-7 text-[#1A1D20]" strokeWidth={2} />
      <div>
        <p className="text-[22px] font-bold text-[#1A1D20] leading-none">
          {value}
          {stat.suffix}
        </p>
        <p className="text-[13px] text-[#6B7280] mt-1">{stat.label}</p>
      </div>
    </div>
  );
}

export default function AnimatedStats() {
  return (
    <div className="flex items-center gap-10 md:gap-14">
      {stats.map((stat) => (
        <StatItem key={stat.label} stat={stat} />
      ))}
    </div>
  );
}
