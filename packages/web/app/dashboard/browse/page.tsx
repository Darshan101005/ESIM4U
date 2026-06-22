"use client";

import DashboardTopbar from "@/components/dashboard/topbar";
import { useEffect, useState, useCallback } from "react";
import { Search, ChevronRight, Globe, MapPin, Loader2, Ship, Flag as FlagIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Flag from "@/components/dashboard/flag";
import PlanGrid from "@/components/dashboard/plan-grid";

interface Country {
  country_name: string;
  iso2_code: string;
  iso3_code: string;
}

interface Region {
  region_code: string;
  region_name: string;
}

type Tab = "countries" | "regions" | "global" | "cruise";

const REGION_IMAGES: Record<string, string> = {
  af: "africa_map.png",
  as: "asia_map.png",
  eu: "europe_map.png",
  me: "middle east &north africa_map.png",
  na: "north america_map.png",
  sa: "southamerica_map.png",
};

const REGION_LABELS: Record<string, string> = {
  me: "Middle East & North Africa",
};

function regionLabel(region: Region) {
  return REGION_LABELS[region.region_code.toLowerCase()] || region.region_name;
}

function regionImage(code: string) {
  return REGION_IMAGES[code.toLowerCase()];
}

export default function BrowsePage() {
  const [tab, setTab] = useState<Tab>("countries");
  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("tab");
    if (t === "regions" || t === "global" || t === "cruise") setTab(t);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [cRes, rRes] = await Promise.all([
        fetch("/api/montyesim/countries"),
        fetch("/api/montyesim/regions"),
      ]);
      if (!cRes.ok) throw new Error("Failed to load destinations");
      const cData = await cRes.json();
      const rData = rRes.ok ? await rRes.json() : { regions: [] };
      setCountries(cData.countries || []);
      setRegions(rData.regions || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredCountries = search
    ? countries.filter(
        (c) =>
          c.country_name.toLowerCase().includes(search.toLowerCase()) ||
          c.iso3_code.toLowerCase().includes(search.toLowerCase())
      )
    : countries;

  const filteredRegions = search
    ? regions.filter(
        (r) =>
          r.region_name.toLowerCase().includes(search.toLowerCase()) ||
          regionLabel(r).toLowerCase().includes(search.toLowerCase())
      )
    : regions;

  const tabs: { key: Tab; label: string; icon: typeof Globe; badge?: string }[] = [
    { key: "countries", label: "Country", icon: FlagIcon },
    { key: "regions", label: "Region", icon: MapPin },
    { key: "global", label: "Global", icon: Globe },
    { key: "cruise", label: "Cruise", icon: Ship, badge: "New" },
  ];

  return (
    <>
      <DashboardTopbar title="Browse eSIMs" />
      <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8">
        <div className="mb-6">
          <p className="text-[15px] text-[#6B7280] font-medium">
            Choose a destination to view available eSIM plans.
          </p>
        </div>

        <div className="flex items-center gap-2 mb-6">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                  tab === t.key ? "bg-[#FF561E] text-white shadow-sm" : "bg-white border border-gray-200 text-[#6B7280] hover:text-[#FF561E]"
                }`}
              >
                <Icon className="w-4 h-4" /> {t.label}
                {t.badge && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none ${
                      tab === t.key ? "bg-white/25 text-white" : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {tab !== "global" && tab !== "cruise" && (
          <div className="relative max-w-md mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={tab === "countries" ? "Search countries..." : "Search regions..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-gray-200 shadow-sm outline-none focus:border-[#FF561E] focus:ring-2 focus:ring-[#FF561E]/10 text-[14px] transition-all"
            />
          </div>
        )}

        {tab === "global" ? (
          <PlanGrid
            fetchUrl="/api/montyesim/bundles?bundle_category=global&page_size=100"
            emptyMessage="No global plans are available right now"
            searchable
          />
        ) : tab === "cruise" ? (
          <PlanGrid
            fetchUrl="/api/montyesim/bundles?bundle_category=cruise&page_size=100"
            emptyMessage="No cruise plans are available right now"
          />
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
            <p className="text-[14px] text-red-600 font-medium">{error}</p>
            <button onClick={load} className="mt-3 text-[13px] text-[#FF561E] font-semibold">
              Try Again
            </button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#FF561E] animate-spin" />
          </div>
        ) : tab === "countries" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredCountries.map((country) => (
              <Link
                key={country.iso3_code}
                href={`/dashboard/browse/${country.iso3_code}?name=${encodeURIComponent(country.country_name)}`}
                className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center justify-between hover:border-orange-100 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-9 rounded-md overflow-hidden border border-gray-100 shrink-0 relative">
                    <Flag code={country.iso3_code} className="w-full h-full" />
                  </div>
                  <p className="text-[15px] font-bold text-[#1A1D20] truncate">{country.country_name}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#FF561E] transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        ) : filteredRegions.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-[15px] text-[#6B7280] font-medium">No regions available right now</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredRegions.map((region) => {
              const label = regionLabel(region);
              const img = regionImage(region.region_code);
              return (
                <Link
                  key={region.region_code}
                  href={`/dashboard/browse/region/${region.region_code}?name=${encodeURIComponent(label)}`}
                  className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center justify-between hover:border-orange-100 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {img ? (
                      <div className="w-12 h-9 rounded-md overflow-hidden border border-gray-100 shrink-0 relative bg-[#FFF4F0]">
                        <Image src={`/assets/Regions/${img}`} alt={label} fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-[#FFF4F0] flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5 text-[#FF561E]" strokeWidth={2} />
                      </div>
                    )}
                    <p className="text-[15px] font-bold text-[#1A1D20] truncate">{label}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#FF561E] transition-colors shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
