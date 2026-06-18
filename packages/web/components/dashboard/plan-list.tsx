"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShoppingCart, Loader2, Database } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import DashboardTopbar from "@/components/dashboard/topbar";
import PlanCard, { PlanBundle } from "@/components/dashboard/plan-card";

interface NormalizedBundle extends PlanBundle {
  primary_country_name: string;
  primary_country_code: string;
  region_name: string;
  cost_price: number;
}

interface PlanListProps {
  fetchUrl: string;
  fallbackTitle: string;
}

export default function PlanList({ fetchUrl, fallbackTitle }: PlanListProps) {
  const router = useRouter();
  const [bundles, setBundles] = useState<NormalizedBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingCode, setAddingCode] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(fetchUrl);
      if (!res.ok) throw new Error("Failed to load plans");
      const data = await res.json();
      setBundles(data.bundles || []);
    } catch {
      toast.error("Failed to load plans");
    } finally {
      setLoading(false);
    }
  }, [fetchUrl]);

  useEffect(() => {
    load();
  }, [load]);

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

  const title = bundles[0]?.primary_country_name || bundles[0]?.region_name || fallbackTitle;

  return (
    <>
      <DashboardTopbar title={title} />
      <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#1A1D20]" />
          </button>
          <div>
            <h2 className="text-[20px] font-bold text-[#1A1D20]">Plans for {title}</h2>
            <p className="text-[13px] text-[#6B7280] font-medium">
              {bundles.length} plan{bundles.length !== 1 ? "s" : ""} available
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/dashboard/cart"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF561E] text-white text-[13px] font-semibold hover:bg-[#E04B18] transition-colors shadow-sm"
          >
            <ShoppingCart className="w-4 h-4" /> View Cart
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#FF561E] animate-spin" />
          </div>
        ) : bundles.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <Database className="w-12 h-12 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-[15px] text-[#6B7280] font-medium">No plans available for this destination</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {bundles.map((bundle) => (
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
      </main>
    </>
  );
}
