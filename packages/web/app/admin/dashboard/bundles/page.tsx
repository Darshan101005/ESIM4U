"use client";

import AdminTopbar from "@/components/admin/admin-topbar";
import { useEffect, useState, useCallback } from "react";
import { Loader2, Package, Search } from "lucide-react";

interface Bundle {
  bundle_code: string;
  bundle_name: string;
  marketing_name: string;
  data_label: string;
  validity_days: number;
  cost_price: number;
  price: number;
  currency: string;
  category: string;
  primary_country_name: string;
  region_name: string;
  country_names: string[];
}

interface Country {
  country_name: string;
  iso3_code: string;
}

interface Region {
  region_code: string;
  region_name: string;
}

type ScopeType = "country" | "region" | "global";

export default function AdminBundlesPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [scopeType, setScopeType] = useState<ScopeType>("country");
  const [scopeCode, setScopeCode] = useState("");
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingBundles, setLoadingBundles] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const loadMeta = useCallback(async () => {
    try {
      const [cRes, regRes] = await Promise.all([
        fetch("/api/montyesim/countries"),
        fetch("/api/montyesim/regions"),
      ]);
      const cData = cRes.ok ? await cRes.json() : { countries: [] };
      const regData = regRes.ok ? await regRes.json() : { regions: [] };
      setCountries(cData.countries || []);
      setRegions(regData.regions || []);
    } finally {
      setLoadingMeta(false);
    }
  }, []);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  const loadBundles = useCallback(async () => {
    if (scopeType !== "global" && !scopeCode) return;
    setLoadingBundles(true);
    setLoaded(true);
    try {
      let param = "bundle_category=global";
      if (scopeType === "country") param = `country_code=${scopeCode}&bundle_category=country`;
      else if (scopeType === "region") param = `region_code=${scopeCode}&bundle_category=region`;
      const res = await fetch(`/api/admin/bundles?${param}&page_size=100`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBundles(data.bundles || []);
      setTotal(typeof data.total === "number" ? data.total : (data.bundles || []).length);
    } catch {
      setBundles([]);
      setTotal(0);
    } finally {
      setLoadingBundles(false);
    }
  }, [scopeType, scopeCode]);

  return (
    <>
      <AdminTopbar title="Bundles" />
      <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8 max-w-6xl mx-auto w-full">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 mb-6">
          <p className="text-[13px] text-[#6B7280] mb-4">
            Inspect the live MontyeSIM catalog with your cost, the customer price after markup, and the resulting margin.
          </p>
          {loadingMeta ? (
            <div className="flex items-center py-4">
              <Loader2 className="w-5 h-5 text-[#FF561E] animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
              <div className="flex-1">
                <label className="block text-[12px] font-medium text-[#6B7280] mb-2">Scope</label>
                <select
                  value={scopeType}
                  onChange={(e) => {
                    setScopeType(e.target.value as ScopeType);
                    setScopeCode("");
                    setBundles([]);
                    setTotal(null);
                    setLoaded(false);
                  }}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 outline-none focus:border-[#FF561E] text-[14px]"
                >
                  <option value="country">Country</option>
                  <option value="region">Region</option>
                  <option value="global">Global</option>
                </select>
              </div>
              {scopeType !== "global" && (
                <div className="flex-1">
                  <label className="block text-[12px] font-medium text-[#6B7280] mb-2">Destination</label>
                  <select
                    value={scopeCode}
                    onChange={(e) => setScopeCode(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 outline-none focus:border-[#FF561E] text-[14px]"
                  >
                    <option value="">Select...</option>
                    {scopeType === "country"
                      ? countries.map((c) => (
                          <option key={c.iso3_code} value={c.iso3_code}>
                            {c.country_name}
                          </option>
                        ))
                      : regions.map((r) => (
                          <option key={r.region_code} value={r.region_code}>
                            {r.region_name}
                          </option>
                        ))}
                  </select>
                </div>
              )}
              <button
                onClick={loadBundles}
                disabled={(scopeType !== "global" && !scopeCode) || loadingBundles}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF561E] text-white text-[14px] font-bold hover:bg-[#E04B18] transition-colors shadow-sm shadow-orange-500/20 disabled:opacity-60"
              >
                {loadingBundles ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Load
              </button>
            </div>
          )}
        </div>

        {loadingBundles ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#FF561E] animate-spin" />
          </div>
        ) : !loaded ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-[14px] text-[#6B7280] font-medium">
              {scopeType === "global" ? "Load the global catalog" : "Select a destination and load bundles"}
            </p>
          </div>
        ) : bundles.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-[14px] text-[#6B7280] font-medium">No bundles found for this selection</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-[15px] font-bold text-[#1A1D20]">Catalog</h3>
              <span className="px-3 py-1 rounded-full bg-[#FFF4F0] text-[#FF561E] text-[12px] font-bold">
                {total ?? bundles.length} bundle{(total ?? bundles.length) !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-5 py-3 text-[12px] font-semibold text-[#6B7280] w-12">#</th>
                    <th className="px-5 py-3 text-[12px] font-semibold text-[#6B7280]">Plan</th>
                    <th className="px-5 py-3 text-[12px] font-semibold text-[#6B7280]">Data</th>
                    <th className="px-5 py-3 text-[12px] font-semibold text-[#6B7280]">Validity</th>
                    <th className="px-5 py-3 text-[12px] font-semibold text-[#6B7280]">Coverage</th>
                    <th className="px-5 py-3 text-[12px] font-semibold text-[#6B7280] text-right">Cost</th>
                    <th className="px-5 py-3 text-[12px] font-semibold text-[#6B7280] text-right">Customer</th>
                    <th className="px-5 py-3 text-[12px] font-semibold text-[#6B7280] text-right">Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {bundles.map((b, i) => {
                    const margin = Math.round((b.price - b.cost_price) * 100) / 100;
                    const coverage =
                      b.category === "country"
                        ? b.primary_country_name || "1 country"
                        : `${(b.country_names || []).length} countries`;
                    return (
                      <tr key={b.bundle_code} className="hover:bg-gray-50/40 transition-colors">
                        <td className="px-5 py-4 text-[13px] text-[#6B7280]">{i + 1}</td>
                        <td className="px-5 py-4 text-[13px] font-semibold text-[#1A1D20]">{b.marketing_name || b.bundle_name}</td>
                        <td className="px-5 py-4 text-[13px] text-[#6B7280]">{b.data_label}</td>
                        <td className="px-5 py-4 text-[13px] text-[#6B7280]">{b.validity_days} days</td>
                        <td className="px-5 py-4 text-[13px] text-[#6B7280]">{coverage}</td>
                        <td className="px-5 py-4 text-[13px] text-[#6B7280] text-right">${b.cost_price.toFixed(2)}</td>
                        <td className="px-5 py-4 text-[13px] font-bold text-[#1A1D20] text-right">${b.price.toFixed(2)}</td>
                        <td className={`px-5 py-4 text-[13px] font-bold text-right ${margin > 0 ? "text-emerald-600" : "text-[#6B7280]"}`}>
                          ${margin.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
