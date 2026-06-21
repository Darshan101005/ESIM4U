"use client";

import { useState } from "react";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import Link from "next/link";
import DashboardTopbar from "@/components/dashboard/topbar";
import PlanGrid from "@/components/dashboard/plan-grid";

interface PlanListProps {
  fetchUrl: string;
  fallbackTitle: string;
  backHref?: string;
  searchable?: boolean;
}

export default function PlanList({ fetchUrl, fallbackTitle, backHref = "/dashboard/browse", searchable = false }: PlanListProps) {
  const [total, setTotal] = useState<number | null>(null);
  const title = fallbackTitle;

  return (
    <>
      <DashboardTopbar title={title} />
      <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href={backHref}
            className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#1A1D20]" />
          </Link>
          <div>
            <h2 className="text-[20px] font-bold text-[#1A1D20]">Plans for {title}</h2>
            <p className="text-[13px] text-[#6B7280] font-medium">
              {total === null ? "Loading plans..." : `${total} plan${total !== 1 ? "s" : ""} available`}
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

        <PlanGrid
          fetchUrl={fetchUrl}
          searchable={searchable}
          onLoaded={({ total: loadedTotal }) => setTotal(loadedTotal)}
        />
      </main>
    </>
  );
}
