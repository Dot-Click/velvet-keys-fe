import * as React from "react";
import type { TemplateLocale } from "../shared/locale";

export interface PdfContextValue {
  locale: TemplateLocale;
  /** Serif font stack for headings, which depends on the language */
  serif: string;
}

export const PdfContext = React.createContext<PdfContextValue | null>(null);

export function usePdf(): PdfContextValue {
  const value = React.useContext(PdfContext);
  if (!value) throw new Error("PDF primitives must be rendered inside <PdfDocument>");
  return value;
}
