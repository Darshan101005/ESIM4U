"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { SupportedCurrency, SUPPORTED_CURRENCIES, CURRENCY_SYMBOLS } from "@/lib/fx";

interface CurrencyContextValue {
  currency: SupportedCurrency;
  setCurrency: (c: SupportedCurrency) => void;
  rates: Record<SupportedCurrency, number> | null;
  ready: boolean;
  error: boolean;
  convert: (usd: number) => number | null;
  format: (usd: number) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const STORAGE_KEY = "esim4u_currency";

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<SupportedCurrency>("USD");
  const [rates, setRates] = useState<Record<SupportedCurrency, number> | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    // 1. Apply the locally-cached choice immediately (avoids a flash).
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as SupportedCurrency | null;
      if (saved && SUPPORTED_CURRENCIES.includes(saved)) setCurrencyState(saved);
    } catch {}

    // 2. Reconcile with the customer's saved preference so every page loads in
    //    their chosen currency (cross-device). Defaults to USD when none is set.
    fetch("/api/profile", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const pref = data?.profile?.preferred_currency as SupportedCurrency | undefined;
        if (pref && SUPPORTED_CURRENCIES.includes(pref)) {
          setCurrencyState(pref);
          try {
            localStorage.setItem(STORAGE_KEY, pref);
          } catch {}
        }
      })
      .catch(() => {});

    fetch("/api/fx")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        if (data.rates) setRates(data.rates);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setReady(true));
  }, []);

  const setCurrency = useCallback((c: SupportedCurrency) => {
    setCurrencyState(c);
    try {
      localStorage.setItem(STORAGE_KEY, c);
    } catch {}
    // Persist the preference so it applies on the next load / other devices.
    fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferred_currency: c }),
    }).catch(() => {});
  }, []);

  const convert = useCallback(
    (usd: number): number | null => {
      if (currency === "USD") return Math.round(usd * 100) / 100;
      if (!rates) return null;
      const value = usd * rates[currency];
      return Math.round(value * 100) / 100;
    },
    [currency, rates]
  );

  const format = useCallback(
    (usd: number): string => {
      const symbol = CURRENCY_SYMBOLS[currency];
      const value = convert(usd);
      if (value === null) return `${symbol}…`;
      return `${symbol}${value.toFixed(2)}`;
    },
    [currency, convert]
  );

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, rates, ready, error, convert, format }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
