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
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as SupportedCurrency | null;
      if (saved && SUPPORTED_CURRENCIES.includes(saved)) setCurrencyState(saved);
    } catch {}

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
  }, []);

  const convert = useCallback(
    (usd: number): number | null => {
      if (currency === "USD") return Math.round(usd * 100) / 100;
      if (!rates) return null;
      const value = usd * rates[currency];
      return currency === "INR" ? Math.round(value) : Math.round(value * 100) / 100;
    },
    [currency, rates]
  );

  const format = useCallback(
    (usd: number): string => {
      const symbol = CURRENCY_SYMBOLS[currency];
      const value = convert(usd);
      if (value === null) return `${symbol}…`;
      const formatted = currency === "INR" ? value.toLocaleString("en-IN") : value.toFixed(2);
      return `${symbol}${formatted}`;
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
