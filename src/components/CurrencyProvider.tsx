"use client";

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";

export type Currency = "BRL" | "USD" | "EUR";

type CurrencyContextType = {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  formatFromBRL: (amountBRL: number) => string;
  convertFromBRL: (amountBRL: number) => number;
  rates: Record<Currency, number>; // rate relative to BRL
};

const CurrencyContext = createContext<CurrencyContextType | null>(null);

const COOKIE = "currency";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires}`;
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("BRL");
  const [rates, setRates] = useState<Record<Currency, number>>({ BRL: 1, USD: 0.2, EUR: 0.18 });

  useEffect(() => {
    // Initial currency from cookie or browser region
    const fromCookie = readCookie(COOKIE) as Currency | null;
    if (fromCookie && ["BRL", "USD", "EUR"].includes(fromCookie)) {
      setCurrencyState(fromCookie as Currency);
    } else if (typeof navigator !== "undefined") {
      const lang = navigator.language?.toUpperCase();
      if (lang?.includes("US")) setCurrencyState("USD");
      else if (lang?.includes("PT") || lang?.includes("BR")) setCurrencyState("BRL");
      else if (lang?.includes("EU") || lang?.includes("DE") || lang?.includes("FR") || lang?.includes("ES")) setCurrencyState("EUR");
    }

    // Fetch rates with BRL as base; fallback to defaults on error
    fetch("https://api.exchangerate.host/latest?base=BRL&symbols=USD,EUR")
      .then((r) => r.json())
      .then((data) => {
        if (data && data.rates) {
          const next = {
            BRL: 1,
            USD: typeof data.rates.USD === "number" ? data.rates.USD : rates.USD,
            EUR: typeof data.rates.EUR === "number" ? data.rates.EUR : rates.EUR,
          } as Record<Currency, number>;
          setRates(next);
        }
      })
      .catch(() => {
        // keep defaults
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    writeCookie(COOKIE, c);
  };

  const convertFromBRL = useCallback((amountBRL: number) => {
    const rate = rates[currency] || 1;
    return amountBRL * rate;
  }, [rates, currency]);

  const formatFromBRL = useCallback((amountBRL: number) => {
    const value = convertFromBRL(amountBRL);
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value);
  }, [convertFromBRL, currency]);

  const value = useMemo(() => ({ currency, setCurrency, formatFromBRL, convertFromBRL, rates }), [currency, rates, formatFromBRL, convertFromBRL]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
