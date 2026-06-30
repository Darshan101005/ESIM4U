"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { Globe, Ship } from "lucide-react";
import { toAlpha2 } from "@/lib/flags";

const KOSOVO_CODES = new Set(["XK", "XKX", "RKS", "KOS"]);

const REGION_IMAGES: Record<string, string> = {
  africa: "africa_map.png",
  asia: "asia_map.png",
  europe: "europe_map.png",
  "middle east": "middle east &north africa_map.png",
  "north america": "north america_map.png",
  "south america": "southamerica_map.png",
};

const Flagpack = dynamic<{ code: string; size?: string; hasBorder?: boolean; hasBorderRadius?: boolean; className?: string }>(
  () => import("react-flagpack").then((m) => m.default || m),
  { ssr: false }
);

interface FlagProps {
  code?: string;
  name?: string;
  size?: "s" | "m" | "l";
  className?: string;
}

function regionImageFor(name?: string): string | null {
  if (!name) return null;
  const n = name.trim().toLowerCase();
  for (const key of Object.keys(REGION_IMAGES)) {
    if (n.includes(key)) return REGION_IMAGES[key];
  }
  return null;
}

export default function Flag({ code, name, size = "m", className = "" }: FlagProps) {
  if (code && KOSOVO_CODES.has(code.trim().toUpperCase())) {
    return (
      <div className={`flex items-center justify-center overflow-hidden ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/Flag_of_Kosovo.svg.webp" alt="Kosovo" className="w-full h-full object-cover" />
      </div>
    );
  }

  const alpha2 = toAlpha2(code);
  if (alpha2) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <Flagpack
          code={alpha2}
          size={size === "m" ? "l" : size}
          hasBorder={false}
          hasBorderRadius={false}
          className="country-flag"
        />
      </div>
    );
  }

  const n = (name || "").trim().toLowerCase();

  if (n.includes("cruise")) {
    return (
      <div className={`flex items-center justify-center bg-[#FFF4F0] ${className}`}>
        <Ship className="w-1/2 h-1/2 text-[#FF561E]" strokeWidth={2} />
      </div>
    );
  }

  if (n.includes("global") || n.includes("worldwide")) {
    return (
      <div className={`relative overflow-hidden bg-[#FFF4F0] ${className}`}>
        <Image src="/assets/Regions/world_map.png" alt="Global" fill className="object-cover" />
      </div>
    );
  }

  const regionImg = regionImageFor(name);
  if (regionImg) {
    return (
      <div className={`relative overflow-hidden bg-[#FFF4F0] ${className}`}>
        <Image src={`/assets/Regions/${regionImg}`} alt={name || "Region"} fill className="object-cover" />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center bg-[#FFF4F0] ${className}`}>
      <Globe className="w-1/2 h-1/2 text-[#FF561E]" strokeWidth={2} />
    </div>
  );
}
