import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enCommon from "../locales/en/common.json";
import enAuth from "../locales/en/auth.json";
import enLanding from "../locales/en/landing.json";
import enOwner from "../locales/en/owner.json";
import enConciergerie from "../locales/en/conciergerie.json";
import enTenant from "../locales/en/tenant.json";
import enAdmin from "../locales/en/admin.json";
import enBilling from "../locales/en/billing.json";
import enTemplates from "../locales/en/templates.json";
import enAdminOverview from "../locales/en/admin-overview.json";
import enAdminClients from "../locales/en/admin-clients.json";
import enAdminProperties from "../locales/en/admin-properties.json";
import enAdminInvoices from "../locales/en/admin-invoices.json";
import enAdminPricing from "../locales/en/admin-pricing.json";

import frCommon from "../locales/fr/common.json";
import frAuth from "../locales/fr/auth.json";
import frLanding from "../locales/fr/landing.json";
import frOwner from "../locales/fr/owner.json";
import frConciergerie from "../locales/fr/conciergerie.json";
import frTenant from "../locales/fr/tenant.json";
import frAdmin from "../locales/fr/admin.json";
import frBilling from "../locales/fr/billing.json";
import frTemplates from "../locales/fr/templates.json";
import frAdminOverview from "../locales/fr/admin-overview.json";
import frAdminClients from "../locales/fr/admin-clients.json";
import frAdminProperties from "../locales/fr/admin-properties.json";
import frAdminInvoices from "../locales/fr/admin-invoices.json";
import frAdminPricing from "../locales/fr/admin-pricing.json";

import arCommon from "../locales/ar/common.json";
import arAuth from "../locales/ar/auth.json";
import arLanding from "../locales/ar/landing.json";
import arOwner from "../locales/ar/owner.json";
import arConciergerie from "../locales/ar/conciergerie.json";
import arTenant from "../locales/ar/tenant.json";
import arAdmin from "../locales/ar/admin.json";
import arBilling from "../locales/ar/billing.json";
import arTemplates from "../locales/ar/templates.json";
import arAdminOverview from "../locales/ar/admin-overview.json";
import arAdminClients from "../locales/ar/admin-clients.json";
import arAdminProperties from "../locales/ar/admin-properties.json";
import arAdminInvoices from "../locales/ar/admin-invoices.json";
import arAdminPricing from "../locales/ar/admin-pricing.json";

export type SupportedLanguage = "en" | "fr" | "ar";
export const SUPPORTED_LANGUAGES: { code: SupportedLanguage; label: string; nativeName: string; dir: "ltr" | "rtl" }[] = [
  { code: "en", label: "English", nativeName: "English", dir: "ltr" },
  { code: "fr", label: "French", nativeName: "Français", dir: "ltr" },
  { code: "ar", label: "Arabic", nativeName: "العربية", dir: "rtl" },
];

export const STORAGE_LANG_KEY = "i18n_lang";

export const defaultNS = "common";
export const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    landing: enLanding,
    owner: enOwner,
    conciergerie: enConciergerie,
    tenant: enTenant,
    admin: enAdmin,
    billing: enBilling,
    templates: enTemplates,
    "admin-overview": enAdminOverview,
    "admin-clients": enAdminClients,
    "admin-properties": enAdminProperties,
    "admin-invoices": enAdminInvoices,
    "admin-pricing": enAdminPricing,
  },
  fr: {
    common: frCommon,
    auth: frAuth,
    landing: frLanding,
    owner: frOwner,
    conciergerie: frConciergerie,
    tenant: frTenant,
    admin: frAdmin,
    billing: frBilling,
    templates: frTemplates,
    "admin-overview": frAdminOverview,
    "admin-clients": frAdminClients,
    "admin-properties": frAdminProperties,
    "admin-invoices": frAdminInvoices,
    "admin-pricing": frAdminPricing,
  },
  ar: {
    common: arCommon,
    auth: arAuth,
    landing: arLanding,
    owner: arOwner,
    conciergerie: arConciergerie,
    tenant: arTenant,
    admin: arAdmin,
    billing: arBilling,
    templates: arTemplates,
    "admin-overview": arAdminOverview,
    "admin-clients": arAdminClients,
    "admin-properties": arAdminProperties,
    "admin-invoices": arAdminInvoices,
    "admin-pricing": arAdminPricing,
  },
} as const;

export function getInitialLanguage(): SupportedLanguage {
  if (typeof window === "undefined") return "en";
  try {
    const saved = window.localStorage.getItem(STORAGE_LANG_KEY);
    if (saved === "en" || saved === "fr" || saved === "ar") return saved;
  } catch {
    // fallback
  }
  return "en";
}

export function syncDocumentDirection(lang: string) {
  if (typeof document === "undefined") return;
  const isRTL = lang === "ar";
  document.documentElement.setAttribute("dir", isRTL ? "rtl" : "ltr");
  document.documentElement.setAttribute("lang", lang);
}

if (!i18n.isInitialized) {
  const initialLang = getInitialLanguage();
  i18n.use(initReactI18next).init({
    resources,
    lng: initialLang,
    fallbackLng: "en",
    defaultNS,
    ns: ["common", "auth", "landing", "owner", "conciergerie", "tenant", "admin", "billing", "templates", "admin-overview", "admin-clients", "admin-properties", "admin-invoices", "admin-pricing"],
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

  if (typeof window !== "undefined") {
    syncDocumentDirection(initialLang);
    i18n.on("languageChanged", (lng) => {
      syncDocumentDirection(lng);
      try {
        window.localStorage.setItem(STORAGE_LANG_KEY, lng);
      } catch {
        // no-op
      }
    });
  }
}

export function setAppLanguage(lang: SupportedLanguage) {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_LANG_KEY, lang);
    } catch {
      // no-op
    }
  }
  syncDocumentDirection(lang);
  return i18n.changeLanguage(lang);
}

export default i18n;
