import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, getAdminCookieName } from "@/lib/admin-auth";
import { fetchBundles } from "@/lib/montyesim";
import { normalizeAndPriceBundles, RawBundle, isWorldwideGlobal, inferRegionCode } from "@/lib/bundles";

function getAdmin(request: NextRequest) {
  const token = request.cookies.get(getAdminCookieName())?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

export async function GET(request: NextRequest) {
  try {
    if (!getAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const countryCode = searchParams.get("country_code") || undefined;
    const regionCode = searchParams.get("region_code") || undefined;
    const bundleCategory = searchParams.get("bundle_category") || undefined;
    const pageSize = searchParams.get("page_size") ? Number(searchParams.get("page_size")) : 100;
    const pageNumber = searchParams.get("page_number") ? Number(searchParams.get("page_number")) : undefined;

    const data = await fetchBundles({ countryCode, regionCode, bundleCategory, pageSize, pageNumber });
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
    }

    return NextResponse.json({ bundles, total: bundles.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch bundles";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
