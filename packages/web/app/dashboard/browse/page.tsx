"use client";

import DashboardTopbar from "@/components/dashboard/topbar";
import { useEffect, useState, useCallback } from "react";
import { Search, ChevronRight, Loader2, Globe, MapPin } from "lucide-react";
import Link from "next/link";
import Flag from "@/components/dashboard/flag";

interface Country {
  country_name: string;
  iso2_code: string;
  iso3_code: string;
}

interface Region {
  region_code: string;
  region_name: string;
}

type Tab = "countries" | "regions";

export default function BrowsePage() {
  const [tab, setTab] = useState<Tab>("countries");
  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

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
    ? regions.filter((r) => r.region_name.toLowerCase().includes(search.toLowerCase()))
    : regions;

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
          <button
            onClick={() => setTab("countries")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
              tab === "countries" ? "bg-[#FF561E] text-white shadow-sm" : "bg-white border border-gray-200 text-[#6B7280] hover:text-[#FF561E]"
            }`}
          >
            <Globe className="w-4 h-4" /> Countries
          </button>
          <button
            onClick={() => setTab("regions")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
              tab === "regions" ? "bg-[#FF561E] text-white shadow-sm" : "bg-white border border-gray-200 text-[#6B7280] hover:text-[#FF561E]"
            }`}
          >
            <MapPin className="w-4 h-4" /> Regions
          </button>
        </div>

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

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#FF561E] animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
            <p className="text-[14px] text-red-600 font-medium">{error}</p>
            <button onClick={load} className="mt-3 text-[13px] text-[#FF561E] font-semibold">
              Try Again
            </button>
          </div>
        ) : tab === "countries" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredCountries.map((country) => (
              <Link
                key={country.iso3_code}
                href={`/dashboard/browse/${country.iso3_code}`}
                className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center justify-between hover:border-orange-100 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-11 h-11 rounded-xl overflow-hidden border border-gray-100 shrink-0">
                    <Flag code={country.iso3_code} className="w-full h-full" />
                  </div>
                  <p className="text-[15px] font-bold text-[#1A1D20] truncate">{country.country_name}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#FF561E] transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredRegions.map((region) => (
              <Link
                key={region.region_code}
                href={`/dashboard/browse/region/${region.region_code}`}
                className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center justify-between hover:border-orange-100 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[#FFF4F0] flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-[#FF561E]" strokeWidth={2} />
                  </div>
                  <p className="text-[15px] font-bold text-[#1A1D20]">{region.region_name}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#FF561E] transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
