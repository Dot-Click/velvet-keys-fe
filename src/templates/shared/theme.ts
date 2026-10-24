import type { TemplateLang } from "./locale";

/** Brand colors shared by every document and email. */
export const BRAND = {
  /** The black of header bands and text */
  ink: "#0B0B0B",
  gold: "#D4AF37",
  /** Gold dark enough to read as text on white */
  goldDeep: "#8C6B14",
  jade: "#A2E8DD",
  ruby: "#8B002B",
  paper: "#FFFFFF",
  /** Page background behind an email card */
  canvas: "#F8F9FA",
  /** Ink at 70% and 55% over white, as solid colors for email clients */
  inkMuted: "#4E4E4E",
  inkSoft: "#767676",
  /** Gold at 40% over white */
  goldRule: "#EEDFAF",
} as const;

/** Print fonts. They load with the app (Google Fonts), so a page rendered from the app has them. */
export const PDF_FONTS: Record<TemplateLang, { serif: string; sans: string }> = {
  en: {
    serif: '"Cormorant Garamond", Georgia, "Times New Roman", serif',
    sans: '"Inter", -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  fr: {
    serif: '"Cormorant Garamond", Georgia, "Times New Roman", serif',
    sans: '"Inter", -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  ar: {
    serif: '"Noto Naskh Arabic", "Cormorant Garamond", Georgia, serif',
    sans: '"IBM Plex Sans Arabic", "Segoe UI", Tahoma, Arial, sans-serif',
  },
};

/** Email fonts: web-safe stacks, because most mail clients ignore web fonts. */
export const EMAIL_FONTS: Record<TemplateLang, { serif: string; sans: string }> = {
  en: {
    serif: 'Georgia, "Times New Roman", serif',
    sans: '-apple-system, "Segoe UI", Helvetica, Arial, sans-serif',
  },
  fr: {
    serif: 'Georgia, "Times New Roman", serif',
    sans: '-apple-system, "Segoe UI", Helvetica, Arial, sans-serif',
  },
  ar: {
    serif: '"Segoe UI", Tahoma, "Times New Roman", serif',
    sans: '"Segoe UI", Tahoma, Arial, sans-serif',
  },
};
