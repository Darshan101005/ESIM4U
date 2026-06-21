"use client";

import { useParams, useSearchParams } from "next/navigation";
import PlanList from "@/components/dashboard/plan-list";

export default function CountryPlansPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const countryCode = params.countryCode as string;
  const name = searchParams.get("name") || countryCode;

  return (
    <PlanList
      fetchUrl={`/api/montyesim/bundles?country_code=${countryCode}&bundle_category=country&page_size=100`}
      fallbackTitle={name}
      backHref="/dashboard/browse"
    />
  );
}
