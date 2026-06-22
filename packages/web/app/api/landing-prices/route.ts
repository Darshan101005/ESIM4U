import { NextResponse } from "next/server";
import { fetchBundles } from "@/lib/montyesim";
import { normalizeAndPriceBundles, isWorldwideGlobal, inferRegionCode, NormalizedBundle } from "@/lib/bundles";

const COUNTRY_ISO3 = ["IND", "GBR", "GRC", "TUR", "DEU", "CHE", "FRA", "ITA", "NLD", "ESP", "PRT", "USA", "THA", "IDN", "KOR", "AUS", "BRA", "CAN", "JPN", "MYS", "SGP", "ARE"];
const REGION_CODES = ["na", "eu", "as", "af", "me", "sa"];

const CACHE_TTL = 60 * 60 * 1000;

interface LandingPrices {
  countries: Record<string, number | null>;
  regions: Record<string, number | null>;
  global: number | null;
}

let cache: { data: LandingPrices; fetchedAt: number } | null = null;

function minPrice(bundles: NormalizedBundle[]): number | null {
  const prices = bundles.map((b) => b.price).filter((p) => p > 0);
  return prices.length ? Math.min(...prices) : null;
}

export async function GET() {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  try {
    const globalData = await fetchBundles({ bundleCategory: "global", pageSize: 100 });
    const globalBundles = await normalizeAndPriceBundles(globalData.bundles || []);
    const worldwide = globalBundles.filter(isWorldwideGlobal);
    const movedByRegion: Record<string, NormalizedBundle[]> = {};
    for (const b of globalBundles) {
      if (isWorldwideGlobal(b)) continue;
      const rc = inferRegionCode(b);
      if (rc) (movedByRegion[rc] = movedByRegion[rc] || []).push(b);
    }

    const countryEntries = await Promise.all(
      COUNTRY_ISO3.map(async (iso3) => {
        try {
          const data = await fetchBundles({ countryCode: iso3, bundleCategory: "country", pageSize: 50 });
          const bundles = await normalizeAndPriceBundles(data.bundles || []);
          return [iso3, minPrice(bundles)] as const;
        } catch {
          return [iso3, null] as const;
        }
      })
    );

    const regionEntries = await Promise.all(
      REGION_CODES.map(async (code) => {
        try {
          const data = await fetchBundles({ regionCode: code, bundleCategory: "region", pageSize: 100 });
          const bundles = await normalizeAndPriceBundles(data.bundles || []);
          return [code, minPrice([...bundles, ...(movedByRegion[code] || [])])] as const;
        } catch {
          return [code, null] as const;
        }
      })
    );

    const result: LandingPrices = {
      countries: Object.fromEntries(countryEntries),
      regions: Object.fromEntries(regionEntries),
      global: minPrice(worldwide),
    };

    cache = { data: result, fetchedAt: Date.now() };
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load prices";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
