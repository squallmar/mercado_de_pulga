"use client";

import { useI18n, type Locale } from "@/i18n/I18nProvider";
import { useCurrency, type Currency } from "./CurrencyProvider";

export default function LanguageCurrencySwitcher() {
  const { locale, setLocale, t } = useI18n();
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="flex items-center space-x-2">
      <label className="sr-only" htmlFor="lang-select">{t("switch.language")}</label>
      <select
        id="lang-select"
        className="vintage-input py-1 px-2 text-sm"
        value={locale}
  onChange={(e) => setLocale(e.target.value as Locale)}
      >
        <option value="pt-BR">{t("lang.pt")}</option>
        <option value="en-US">{t("lang.en")}</option>
      </select>

      <label className="sr-only" htmlFor="currency-select">{t("switch.currency")}</label>
      <select
        id="currency-select"
        className="vintage-input py-1 px-2 text-sm"
        value={currency}
  onChange={(e) => setCurrency(e.target.value as Currency)}
      >
        <option value="BRL">{t("currency.BRL")}</option>
        <option value="USD">{t("currency.USD")}</option>
        <option value="EUR">{t("currency.EUR")}</option>
      </select>
    </div>
  );
}
