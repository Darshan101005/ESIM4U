import { NextRequest, NextResponse } from "next/server";
import { fetchBundles } from "@/lib/montyesim";
import { normalizeAndPriceBundles, RawBundle, isWorldwideGlobal, inferRegionCode } from "@/lib/bundles";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const countryCode = searchParams.get("country_code") || undefined;
    const regionCode = searchParams.get("region_code") || undefined;
    const bundleCategory = searchParams.get("bundle_category") || undefined;
    const bundleCode = searchParams.get("bundle_code") || undefined;
    const pageSize = searchParams.get("page_size") ? Number(searchParams.get("page_size")) : undefined;
    const pageNumber = searchParams.get("page_number") ? Number(searchParams.get("page_number")) : undefined;

    const data = await fetchBundles({
      countryCode,
      regionCode,
      bundleCategory,
      bundleCode,
      pageSize,
      pageNumber,
    });

    const rawBundles: RawBundle[] = data.bundles || [];
    let bundles = await normalizeAndPriceBundles(rawBundles);

    if (bundleCategory === "global") {
      bundles = bundles.filter(isWorldwideGlobal);
    } else if (bundleCategory === "region" && regionCode) {
      const globalData = await fetchBundles({ bundleCategory: "global", pageSize: 100 });
      const globalBundles = await normalizeAndPriceBundles(globalData.bundles || []);
      const movedIntoRegion = globalBundles.filter(
        (b) => !isWorldwideGlobal(b) && inferRegionCode(b) === regionCode.toLowerCase()
      );
      bundles = [...movedIntoRegion, ...bundles];
    } else if (countryCode && bundles.length === 0) {
      const iso3 = countryCode.toUpperCase();
      const [regionData, globalData] = await Promise.all([
        fetchBundles({ bundleCategory: "region", pageSize: 100 }),
        fetchBundles({ bundleCategory: "global", pageSize: 100 }),
      ]);
      const [regionBundles, globalBundles] = await Promise.all([
        normalizeAndPriceBundles(regionData.bundles || []),
        normalizeAndPriceBundles(globalData.bundles || []),
      ]);
      const covering = [...regionBundles, ...globalBundles].filter((b) =>
        (b.country_codes || []).some((c) => c.toUpperCase() === iso3)
      );
      const seen = new Set<string>();
      bundles = covering
        .filter((b) => (seen.has(b.bundle_code) ? false : seen.add(b.bundle_code)))
        .sort((a, b) => a.price - b.price);
    }

    return NextResponse.json({
      bundles,
      total: bundles.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch bundles";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
