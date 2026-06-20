"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Globe, Smartphone } from "lucide-react";

const IMAGES = [
  "/assets/Dashboard/dashboard1.png",
  "/assets/Dashboard/dashboard2.png",
  "/assets/Dashboard/dashboard3.png",
  "/assets/Dashboard/dashabord4.png",
];

const ROTATE_MS = 5000;

export default function HeroCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % IMAGES.length);
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative rounded-2xl overflow-hidden h-full min-h-[300px]">
      {IMAGES.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0 transition-opacity duration-[1500ms] ease-in-out"
          style={{
            opacity: i === active ? 1 : 0,
            backgroundImage: `url(${src})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      ))}

      <div className="absolute inset-0 bg-gradient-to-r from-[#13182B]/90 via-[#13182B]/55 to-transparent" />

      <div className="relative z-10 h-full flex flex-col justify-center p-8 lg:p-10 max-w-[560px]">
        <h2 className="text-white text-[28px] lg:text-[32px] font-bold leading-[1.15] tracking-tight">
          Your next adventure
          <br />
          starts with eSIM4U
        </h2>
        <p className="text-white/80 text-[14px] lg:text-[15px] font-medium mt-3 mb-6 max-w-[380px]">
          Stay connected in 200+ countries with affordable data plans. Instant setup, no physical SIM needed.
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/browse"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#FF561E] text-white text-[14px] font-bold hover:bg-[#E04B18] transition-colors shadow-lg shadow-orange-500/25"
          >
            <Globe className="w-4 h-4" /> Browse eSIM Plans
          </Link>
          <Link
            href="/dashboard/esims"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/95 text-[#1A1D20] text-[14px] font-bold hover:bg-white transition-colors"
          >
            <Smartphone className="w-4 h-4" /> My eSIMs
          </Link>
        </div>
      </div>

      <div className="absolute bottom-5 right-6 z-10 flex items-center gap-1.5">
        {IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === active ? "w-6 bg-white" : "w-1.5 bg-white/50"
            }`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
