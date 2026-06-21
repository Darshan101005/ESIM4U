"use client";

import { useParams, useSearchParams } from "next/navigation";
import PlanList from "@/components/dashboard/plan-list";

export default function RegionPlansPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const regionCode = params.regionCode as string;
  const name = searchParams.get("name") || "Region";

  return (
    <PlanList
      fetchUrl={`/api/montyesim/bundles?region_code=${regionCode}&bundle_category=region&page_size=100`}
      fallbackTitle={name}
      backHref="/dashboard/browse?tab=regions"
      searchable
    />
  );
}
