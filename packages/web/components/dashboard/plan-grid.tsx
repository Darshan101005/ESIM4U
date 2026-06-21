"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import { Package, Search } from "lucide-react";
import PlanCard, { PlanBundle } from "@/components/dashboard/plan-card";
import { Skeleton } from "@/components/dashboard/skeleton";

interface NormalizedBundle extends PlanBundle {
  primary_country_name: string;
  primary_country_code: string;
  country_codes: string[];
  region_name: string;
  region_code: string;
  cost_price: number;
}

interface PlanGridProps {
  fetchUrl: string;
  emptyMessage?: string;
  searchable?: boolean;
  onLoaded?: (info: { title: string; total: number }) => void;
}

function PlanCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="w-8 h-8 rounded-lg" />
        </div>
        <Skeleton className="h-px w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
      <div className="flex items-center justify-between bg-[#FFF4F0] px-5 py-4">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>
    </div>
  );
}

export default function PlanGrid({ fetchUrl, emptyMessage = "No plans available for this destination", searchable = false, onLoaded }: PlanGridProps) {
  const [bundles, setBundles] = useState<NormalizedBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [addingCode, setAddingCode] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(fetchUrl);
      if (!res.ok) throw new Error("Failed to load plans");
      const data = await res.json();
      const list: NormalizedBundle[] = data.bundles || [];
      setBundles(list);
      onLoaded?.({
        title: list[0]?.primary_country_name || list[0]?.region_name || "",
        total: typeof data.total === "number" ? data.total : list.length,
      });
    } catch {
      toast.error("Failed to load plans");
      setBundles([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchUrl]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return bundles;
    return bundles.filter((b) => {
      const name = (b.marketing_name || b.bundle_name || "").toLowerCase();
      if (name.includes(q)) return true;
      return (b.country_names || []).some((c) => c.toLowerCase().includes(q));
    });
  }, [bundles, query]);

  const addToCart = async (bundle: PlanBundle) => {
    const full = bundles.find((b) => b.bundle_code === bundle.bundle_code);
    if (!full) return;
    setAddingCode(bundle.bundle_code);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bundle_code: full.bundle_code,
          bundle_name: full.marketing_name || full.bundle_name,
          country: full.primary_country_name || full.region_name,
          country_code: full.primary_country_code,
          data_amount: full.data_label,
          validity: `${full.validity_days} days`,
          price: full.price,
          cost_price: full.cost_price,
          currency: full.currency || "USD",
        }),
      });

      if (res.status === 409) {
        toast.error("Already in cart");
        setAdded((prev) => new Set(prev).add(bundle.bundle_code));
        return;
      }
      if (!res.ok) throw new Error("Failed to add to cart");

      setAdded((prev) => new Set(prev).add(bundle.bundle_code));
      toast.success("Added to cart");
    } catch {
      toast.error("Failed to add to cart");
    } finally {
      setAddingCode(null);
    }
  };

  const searchBar = searchable ? (
    <div className="relative max-w-md mb-6">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        placeholder="Search by country (e.g. China, France)..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-gray-200 shadow-sm outline-none focus:border-[#FF561E] focus:ring-2 focus:ring-[#FF561E]/10 text-[14px] transition-all"
      />
    </div>
  ) : null;

  if (loading) {
    return (
      <>
        {searchBar}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <PlanCardSkeleton key={i} />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      {searchBar}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-[15px] text-[#6B7280] font-medium">
            {query.trim() ? `No plans cover "${query.trim()}"` : emptyMessage}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((bundle) => (
            <PlanCard
              key={bundle.bundle_code}
              bundle={bundle}
              added={added.has(bundle.bundle_code)}
              adding={addingCode === bundle.bundle_code}
              onAdd={addToCart}
            />
          ))}
        </div>
      )}
    </>
  );
}
