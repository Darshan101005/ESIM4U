import { getPricer } from "@/lib/pricing";

export interface RawBundle {
  bundle_code: string;
  bundle_name: string;
  bundle_marketing_name?: string;
  bundle_category?: string;
  country_code?: string[];
  country_name?: string[];
  region_code?: string;
  region_name?: string;
  gprs_limit?: number;
  data_unit?: string;
  unlimited?: boolean;
  validity?: number;
  bundle_price_final?: number;
  subscriber_price?: number;
  reseller_retail_price?: number;
  currency_code_list?: string[];
  additional_currency_code?: string;
  support_topup?: boolean;
}

export interface NormalizedBundle {
  bundle_code: string;
  bundle_name: string;
  marketing_name: string;
  category: string;
  country_codes: string[];
  country_names: string[];
  primary_country_code: string;
  primary_country_name: string;
  region_code: string;
  region_name: string;
  data_label: string;
  data_amount: number;
  data_unit: string;
  unlimited: boolean;
  validity_days: number;
  cost_price: number;
  price: number;
  currency: string;
  supports_topup: boolean;
}

function dataLabel(raw: RawBundle): string {
  if (raw.unlimited) return "Unlimited";
  const amount = raw.gprs_limit ?? 0;
  const unit = raw.data_unit || "GB";
  return `${amount} ${unit}`;
}

export function normalizeBundle(raw: RawBundle): NormalizedBundle {
  const countryCodes = Array.isArray(raw.country_code) ? raw.country_code : [];
  const countryNames = Array.isArray(raw.country_name) ? raw.country_name : [];
  const cost =
    typeof raw.bundle_price_final === "number"
      ? raw.bundle_price_final
      : typeof raw.subscriber_price === "number"
      ? raw.subscriber_price
      : 0;
  const currency = "USD";

  return {
    bundle_code: raw.bundle_code,
    bundle_name: raw.bundle_name,
    marketing_name: raw.bundle_marketing_name || raw.bundle_name,
    category: raw.bundle_category || "country",
    country_codes: countryCodes,
    country_names: countryNames,
    primary_country_code: countryCodes[0] || "",
    primary_country_name: countryNames[0] || raw.region_name || "",
    region_code: raw.region_code || "",
    region_name: raw.region_name || "",
    data_label: dataLabel(raw),
    data_amount: raw.gprs_limit ?? 0,
    data_unit: raw.data_unit || "GB",
    unlimited: Boolean(raw.unlimited),
    validity_days: raw.validity ?? 0,
    cost_price: cost,
    price: cost,
    currency,
    supports_topup: Boolean(raw.support_topup),
  };
}

export async function normalizeAndPriceBundles(rawBundles: RawBundle[]): Promise<NormalizedBundle[]> {
  const pricer = await getPricer();
  return rawBundles.map((raw) => {
    const bundle = normalizeBundle(raw);
    bundle.price = pricer.priceFor(bundle.cost_price, {
      bundleCode: bundle.bundle_code,
      countryCodes: bundle.country_codes,
      regionCode: bundle.region_code,
    });
    return bundle;
  });
}

const REGION_CODE_SET = new Set(["af", "as", "eu", "me", "na", "sa"]);

const REGION_NAME_TO_CODE: [RegExp, string][] = [
  [/middle\s*east/i, "me"],
  [/north\s*america/i, "na"],
  [/south\s*america/i, "sa"],
  [/africa/i, "af"],
  [/europe/i, "eu"],
  [/asia/i, "as"],
];

const WORLDWIDE_MIN_COUNTRIES = 50;

export function inferRegionCode(bundle: NormalizedBundle): string | null {
  const code = (bundle.region_code || "").toLowerCase();
  if (REGION_CODE_SET.has(code)) return code;
  const haystack = `${bundle.marketing_name} ${bundle.bundle_name} ${bundle.region_name}`;
  for (const [pattern, regionCode] of REGION_NAME_TO_CODE) {
    if (pattern.test(haystack)) return regionCode;
  }
  return null;
}

export function isWorldwideGlobal(bundle: NormalizedBundle): boolean {
  if (bundle.country_codes.length >= WORLDWIDE_MIN_COUNTRIES) return true;
  return inferRegionCode(bundle) === null;
}
