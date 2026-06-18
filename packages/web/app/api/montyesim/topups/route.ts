import { NextRequest, NextResponse } from "next/server";
import { fetchAvailableTopups } from "@/lib/montyesim";
import { normalizeAndPriceBundles, RawBundle } from "@/lib/bundles";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bundleCode = searchParams.get("bundle_code");
    const countryCode = searchParams.get("country_code") || undefined;

    if (!bundleCode) {
      return NextResponse.json({ error: "bundle_code is required" }, { status: 400 });
    }

    const data = await fetchAvailableTopups(bundleCode, countryCode);
    const rawBundles: RawBundle[] = data.bundles || [];
    const bundles = await normalizeAndPriceBundles(rawBundles);

    return NextResponse.json({ bundles });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch topups";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
