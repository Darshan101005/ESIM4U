export type SupportedCurrency = "USD" | "EUR" | "GBP" | "INR";

export const SUPPORTED_CURRENCIES: SupportedCurrency[] = ["USD", "EUR", "GBP", "INR"];

export const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
};

export interface FxRates {
  base: "USD";
  date: string;
  rates: Record<SupportedCurrency, number>;
  fetchedAt: number;
}

const FX_SOURCE = "https://api.frankfurter.dev/v1/latest?base=USD&symbols=EUR,GBP,INR";
const CACHE_TTL = 60 * 60 * 1000;

let cache: FxRates | null = null;

export async function getFxRates(): Promise<FxRates> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return cache;
  }

  const res = await fetch(FX_SOURCE, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`FX source returned ${res.status}`);
  }

  const data = await res.json();
  const eur = data?.rates?.EUR;
  const gbp = data?.rates?.GBP;
  const inr = data?.rates?.INR;

  if (typeof eur !== "number" || typeof gbp !== "number" || typeof inr !== "number") {
    throw new Error("FX source returned incomplete rates");
  }

  cache = {
    base: "USD",
    date: data.date,
    rates: { USD: 1, EUR: eur, GBP: gbp, INR: inr },
    fetchedAt: Date.now(),
  };

  return cache;
}

export function convertFromUsd(amountUsd: number, currency: SupportedCurrency, rates: FxRates): number {
  const rate = rates.rates[currency];
  const value = amountUsd * rate;
  if (currency === "INR") return Math.round(value);
  return Math.round(value * 100) / 100;
}
