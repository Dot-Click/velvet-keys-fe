import type { CSSProperties } from "react";
import type { CompanyLegal } from "@/types/billing";
import type { TemplateLang } from "../shared/locale";
import { BRAND } from "../shared/theme";

/** What every email needs from the system that sends it. */
export interface EmailBaseProps {
  lang: TemplateLang;
  /**
   * Where the images are served from, with no trailing slash, e.g. "https://app.example.com".
   * Mail clients cannot load images from a relative path.
   */
  assetBaseUrl: string;
  /** The platform's legal details, shown in the footer when given */
  legal?: CompanyLegal;
}

/** Path of the logo mark under `assetBaseUrl` (a PNG, because most mail clients drop SVG). */
export const EMAIL_LOGO_PATH = "/email/logo-mark.png";

/** Everything a template sets that depends on the reading direction. Mail clients lack logical CSS. */
export function sides(dir: "ltr" | "rtl") {
  const rtl = dir === "rtl";
  return { start: rtl ? "right" : "left", end: rtl ? "left" : "right" } as const;
}

/** Body copy. */
export const paragraph: CSSProperties = {
  fontSize: 15,
  lineHeight: "24px",
  color: BRAND.ink,
  margin: "0 0 16px",
};

/** Footnotes and secondary lines. */
export const small: CSSProperties = {
  fontSize: 12,
  lineHeight: "18px",
  color: BRAND.inkSoft,
  margin: "0 0 6px",
};
