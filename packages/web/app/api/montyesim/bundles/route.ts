import { NextRequest, NextResponse } from "next/server";
import { fetchBundles } from "@/lib/montyesim";
import { normalizeAndPriceBundles, RawBundle } from "@/lib/bundles";

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
    const bundles = await normalizeAndPriceBundles(rawBundles);

    return NextResponse.json({
      bundles,
      total: data.total_bundles_count || bundles.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch bundles";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
