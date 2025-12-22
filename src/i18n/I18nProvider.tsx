"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import PT from "./locales/pt.json";
import EN from "./locales/en.json";

export type Locale = "pt-BR" | "en-US";

type Messages = Record<string, string>;

type I18nContextType = {
  locale: Locale;
  t: (key: string) => string;
  setLocale: (next: Locale) => void;
};

const I18nContext = createContext<I18nContextType | null>(null);

const messagesByLocale: Record<Locale, Messages> = {
  "pt-BR": PT,
  "en-US": EN,
};

const COOKIE_NAME = "locale";

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

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("pt-BR");

  useEffect(() => {
    const fromCookie = readCookie(COOKIE_NAME) as Locale | null;
    if (fromCookie && messagesByLocale[fromCookie]) {
      setLocaleState(fromCookie);
      return;
    }
    // Fallback: use browser language
    if (typeof navigator !== "undefined") {
      const nav = navigator.language?.toLowerCase();
      if (nav.startsWith("en")) setLocaleState("en-US");
      else setLocaleState("pt-BR");
    }
  }, []);

  const t = useMemo(() => {
    const messages = messagesByLocale[locale] || {};
    return (key: string) => messages[key] ?? key;
  }, [locale]);

  const setLocale = (next: Locale) => {
    writeCookie(COOKIE_NAME, next);
    setLocaleState(next);
    // Reload to update html lang and any SSR bits
    if (typeof window !== "undefined") window.location.reload();
  };

  const value = useMemo(() => ({ locale, t, setLocale }), [locale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
