"use client";

import { useParams } from "next/navigation";
import PlanList from "@/components/dashboard/plan-list";

export default function CountryPlansPage() {
  const params = useParams();
  const countryCode = params.countryCode as string;

  return (
    <PlanList
      fetchUrl={`/api/montyesim/bundles?country_code=${countryCode}&bundle_category=country&page_size=100`}
      fallbackTitle={countryCode}
    />
  );
}
