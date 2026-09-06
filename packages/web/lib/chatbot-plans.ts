import { fetchBundles, fetchAvailableCountries } from "@/lib/montyesim";
import { normalizeAndPriceBundles, isWorldwideGlobal, type NormalizedBundle } from "@/lib/bundles";

/**
 * Live plan lookup for the chatbot. Lets the assistant answer "suggest Pakistan
 * plans" with real, current, customer-priced bundles instead of telling the user
 * to go to the website. Country list is cached briefly to stay responsive.
 */

interface CountryEntry {
  name: string;
  iso3: string;
}

let countriesCache: { data: CountryEntry[]; ts: number } | null = null;
const COUNTRIES_TTL = 30 * 60 * 1000; // 30 min

async function getCountries(): Promise<CountryEntry[]> {
  if (countriesCache && Date.now() - countriesCache.ts < COUNTRIES_TTL) return countriesCache.data;
  try {
    const raw = await fetchAvailableCountries();
    const list: CountryEntry[] = (raw.countries || [])
      .map((c: { country_name?: string; iso3_code?: string }) => ({
        name: String(c.country_name || "").trim(),
        iso3: String(c.iso3_code || "").trim(),
      }))
      .filter((c: CountryEntry) => c.name && c.iso3);
    if (list.length) countriesCache = { data: list, ts: Date.now() };
    return list;
  } catch {
    return countriesCache?.data || [];
  }
}

// Common short aliases → the full country name to look up.
const ALIASES: { re: RegExp; name: string }[] = [
  { re: /\b(uk|u\.k\.|britain|british|england|scotland|wales)\b/i, name: "united kingdom" },
  { re: /\b(usa|u\.s\.a\.|u\.s\.|america|american|states)\b/i, name: "united states" },
  { re: /\b(uae|emirates|dubai|abu dhabi)\b/i, name: "united arab emirates" },
  { re: /\b(korea)\b/i, name: "south korea" },
];

/** Detects a country mentioned in the user's message (longest match wins). */
export async function detectCountry(text: string): Promise<CountryEntry | null> {
  const list = await getCountries();
  if (list.length === 0) return null;
  const lower = ` ${text.toLowerCase()} `;

  let best: CountryEntry | null = null;
  for (const c of list) {
    const n = c.name.toLowerCase();
    if (n.length < 3) continue;
    if (lower.includes(n) && (!best || c.name.length > best.name.length)) best = c;
  }
  if (best) return best;

  // Try aliases.
  for (const a of ALIASES) {
    if (a.re.test(text)) {
      const found = list.find((c) => c.name.toLowerCase() === a.name);
      if (found) return found;
    }
  }
  return null;
}

/** Fetches customer-priced plans for a country (with region/global fallback). */
export async function getPlansForCountry(iso3: string): Promise<NormalizedBundle[]> {
  let bundles: NormalizedBundle[] = [];
  try {
    const data = await fetchBundles({ countryCode: iso3, bundleCategory: "country", pageSize: 100 });
    bundles = await normalizeAndPriceBundles(data.bundles || []);
  } catch {
    bundles = [];
  }

  if (bundles.length === 0) {
    // Fall back to region/global bundles that cover this country.
    try {
      const [r, g] = await Promise.all([
        fetchBundles({ bundleCategory: "region", pageSize: 100 }),
        fetchBundles({ bundleCategory: "global", pageSize: 100 }),
      ]);
      const [rb, gb] = await Promise.all([
        normalizeAndPriceBundles(r.bundles || []),
        normalizeAndPriceBundles(g.bundles || []),
      ]);
      const iso = iso3.toUpperCase();
      bundles = [...rb, ...gb].filter((b) => (b.country_codes || []).some((c) => c.toUpperCase() === iso));
    } catch {
      bundles = [];
    }
  }

  return bundles.sort((a, b) => a.price - b.price);
}

/* ------------------------------- regions --------------------------------- */
const REGIONS: { re: RegExp; code: string; name: string }[] = [
  { re: /\bmiddle\s*east\b/i, code: "me", name: "Middle East" },
  { re: /\bnorth\s*america\b/i, code: "na", name: "North America" },
  { re: /\bsouth\s*america\b/i, code: "sa", name: "South America" },
  { re: /\bafrica\b/i, code: "af", name: "Africa" },
  { re: /\beurope|european\b/i, code: "eu", name: "Europe" },
  { re: /\basia|asian\b/i, code: "as", name: "Asia" },
];

function detectRegion(text: string): { code: string; name: string } | null {
  for (const r of REGIONS) if (r.re.test(text)) return { code: r.code, name: r.name };
  return null;
}

function isGlobalQuery(text: string): boolean {
  return /\b(global|worldwide|international|multi[- ]?country|many countries|everywhere|around the world)\b/i.test(text);
}

export async function getRegionPlans(code: string): Promise<NormalizedBundle[]> {
  try {
    const data = await fetchBundles({ bundleCategory: "region", regionCode: code, pageSize: 100 });
    const bundles = await normalizeAndPriceBundles(data.bundles || []);
    return bundles.sort((a, b) => a.price - b.price);
  } catch {
    return [];
  }
}

export async function getGlobalPlans(): Promise<NormalizedBundle[]> {
  try {
    const data = await fetchBundles({ bundleCategory: "global", pageSize: 100 });
    const bundles = await normalizeAndPriceBundles(data.bundles || []);
    return bundles.filter(isWorldwideGlobal).sort((a, b) => a.price - b.price);
  } catch {
    return [];
  }
}

export interface PlanTarget {
  type: "country" | "region" | "global";
  code: string;
  name: string;
}

/** Cheap detection of what the user is asking about (country > region > global). */
export async function detectPlanTarget(userMessage: string): Promise<PlanTarget | null> {
  const country = await detectCountry(userMessage);
  if (country) return { type: "country", code: country.iso3, name: country.name };
  const region = detectRegion(userMessage);
  if (region) return { type: "region", code: region.code, name: region.name };
  if (isGlobalQuery(userMessage)) return { type: "global", code: "", name: "Global / Worldwide" };
  return null;
}

function formatPlans(name: string, bundles: NormalizedBundle[]): string {
  if (bundles.length === 0) return `AVAILABLE PLANS FOR ${name.toUpperCase()}: none are currently available.`;
  const lines = bundles.slice(0, 8).map((b) => {
    const data = b.unlimited ? "Unlimited data" : b.data_label;
    return `- ${data}, ${b.validity_days} days — $${b.price.toFixed(2)} USD (${b.marketing_name})`;
  });
  return [
    `AVAILABLE PLANS FOR ${name.toUpperCase()} (real & current — present these directly, prices in USD, buyable at esim4u.uk):`,
    ...lines,
  ].join("\n");
}

/** Fetches and formats plans for a detected target. */
export async function fetchPlansText(target: PlanTarget): Promise<string> {
  try {
    if (target.type === "country") return formatPlans(target.name, await getPlansForCountry(target.code));
    if (target.type === "region") return formatPlans(target.name, await getRegionPlans(target.code));
    return formatPlans(target.name, await getGlobalPlans());
  } catch {
    return "";
  }
}

/** Convenience: detect + fetch in one call (no status updates). */
export async function buildPlansContext(userMessage: string): Promise<string> {
  const target = await detectPlanTarget(userMessage);
  if (!target) return "";
  return fetchPlansText(target);
}
