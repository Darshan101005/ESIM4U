import { NextResponse } from "next/server";
import { fetchBundles } from "@/lib/montyesim";
import { normalizeAndPriceBundles, RawBundle } from "@/lib/bundles";

interface Destination {
  name: string;
  iso3: string;
  image: string;
  fromPrice: number | null;
}

const DESTINATIONS: { name: string; iso3: string; image: string }[] = [
  { name: "United States", iso3: "USA", image: "/assets/Locations/usa.png" },
  { name: "United Kingdom", iso3: "GBR", image: "/assets/Locations/england.png" },
  { name: "Japan", iso3: "JPN", image: "/assets/Locations/japan.png" },
  { name: "Turkey", iso3: "TUR", image: "/assets/Locations/turkey.png" },
  { name: "Singapore", iso3: "SGP", image: "/assets/Locations/singapore.png" },
  { name: "France", iso3: "FRA", image: "/assets/Locations/france.png" },
  { name: "Switzerland", iso3: "CHE", image: "/assets/Locations/switzerland.png" },
  { name: "United Arab Emirates", iso3: "ARE", image: "/assets/Locations/uae.png" },
  { name: "Australia", iso3: "AUS", image: "/assets/Locations/australia.png" },
  { name: "Canada", iso3: "CAN", image: "/assets/Locations/canada.png" },
  { name: "Brazil", iso3: "BRA", image: "/assets/Locations/brazil.png" },
  { name: "Malaysia", iso3: "MYS", image: "/assets/Locations/malaysia.png" },
];

const CACHE_TTL = 60 * 60 * 1000;

let cache: { data: Destination[]; fetchedAt: number } | null = null;

async function minPriceFor(iso3: string): Promise<number | null> {
  try {
    const data = await fetchBundles({ countryCode: iso3, bundleCategory: "country", pageSize: 50 });
    const raw: RawBundle[] = data.bundles || [];
    if (raw.length === 0) return null;
    const priced = await normalizeAndPriceBundles(raw);
    const prices = priced.map((b) => b.price).filter((p) => p > 0);
    if (prices.length === 0) return null;
    return Math.min(...prices);
  } catch {
    return null;
  }
}

export async function GET() {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return NextResponse.json({ destinations: cache.data });
  }

  try {
    const data = await Promise.all(
      DESTINATIONS.map(async (d) => ({ ...d, fromPrice: await minPriceFor(d.iso3) }))
    );
    cache = { data, fetchedAt: Date.now() };
    return NextResponse.json({ destinations: data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load destinations";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
