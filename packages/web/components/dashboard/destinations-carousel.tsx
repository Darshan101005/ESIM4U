"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { useCurrency } from "@/lib/currency-context";

interface Destination {
  name: string;
  iso3: string;
  image: string;
  fromPrice: number | null;
}

export default function DestinationsCarousel({ destinations }: { destinations: Destination[] }) {
  const { format } = useCurrency();
  const trackRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const offsetRef = useRef(0);
  const pausedRef = useRef(false);

  const items = destinations.length > 0 ? [...destinations, ...destinations] : [];

  useEffect(() => {
    if (items.length === 0) return;
    const SPEED = 0.4;
    const animate = () => {
      const track = trackRef.current;
      if (track && !pausedRef.current) {
        offsetRef.current += SPEED;
        const half = track.scrollWidth / 2;
        if (half > 0 && offsetRef.current >= half) offsetRef.current -= half;
        track.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
      }
      rafRef.current = window.requestAnimationFrame(animate);
    };
    rafRef.current = window.requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [items.length]);

  if (destinations.length === 0) return null;

  return (
    <div
      className="overflow-hidden"
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
    >
      <div ref={trackRef} className="flex gap-4 w-max will-change-transform">
        {items.map((d, i) => (
          <Link
            key={`${d.iso3}-${i}`}
            href={`/dashboard/browse/${d.iso3}`}
            className="group relative w-[200px] h-[200px] rounded-2xl overflow-hidden shrink-0 shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
            draggable={false}
          >
            <Image
              src={d.image}
              alt={d.name}
              fill
              sizes="200px"
              className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
              draggable={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3.5">
              <p className="text-white text-[14px] font-bold leading-tight drop-shadow">{d.name}</p>
              {d.fromPrice != null ? (
                <p className="text-white/90 text-[12px] font-medium mt-0.5 drop-shadow">From {format(d.fromPrice)}</p>
              ) : (
                <p className="text-white/90 text-[12px] font-medium mt-0.5 inline-flex items-center gap-1">
                  View plans <ArrowUpRight className="w-3 h-3" />
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
