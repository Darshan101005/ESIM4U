"use client";

import { useParams } from "next/navigation";
import PlanList from "@/components/dashboard/plan-list";

export default function RegionPlansPage() {
  const params = useParams();
  const regionCode = params.regionCode as string;

  return (
    <PlanList
      fetchUrl={`/api/montyesim/bundles?region_code=${regionCode}&bundle_category=region&page_size=100`}
      fallbackTitle="Region"
    />
  );
}
