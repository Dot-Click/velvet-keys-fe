import { cn } from "@/lib/utils";
import type { CompanyLegal } from "@/types/billing";
import type { TemplateLocale } from "../shared/locale";

/** A4 in millimetres. */
export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;

/** Small caps label above a value. Arabic keeps its letters joined, so it is never spaced out. */
export function pdfLabelClass(locale: TemplateLocale) {
  return cn(
    "text-[6.5pt] font-semibold text-[#0B0B0B]/50",
    locale.dir === "ltr" && "uppercase tracking-[0.16em]",
  );
}

/** Cell styles for the compact tables on a page. */
export const PDF_TH =
  "border-b border-[#0B0B0B]/20 pb-[1.5mm] text-start text-[6.5pt] font-semibold text-[#0B0B0B]/55";
export const PDF_TD = "border-b border-[#0B0B0B]/10 py-[2mm] align-top";

/** The footer identifiers for the platform's own legal details, labelled in the document's language. */
export function companyLegalIdentifiers(locale: TemplateLocale, legal: CompanyLegal) {
  const { t } = locale;
  return [
    { label: t("billing:doc.legal.ice"), value: legal.ice },
    { label: t("billing:doc.legal.if"), value: legal.if },
    { label: t("billing:doc.legal.rc"), value: legal.rc },
    { label: t("billing:doc.legal.patente"), value: legal.patente },
    { label: t("billing:doc.rib"), value: legal.rib },
  ];
}
