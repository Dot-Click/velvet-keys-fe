import * as React from "react";
import { LogoHorizontal } from "@/components/brand";
import { cn } from "@/lib/utils";
import type { TemplateLocale } from "../shared/locale";
import { PDF_FONTS } from "../shared/theme";
import { PdfContext, usePdf } from "./context";
import { pdfLabelClass } from "./styles";

/** Pages are exactly A4 with no margin, and each starts a new sheet when printed. */
const DOCUMENT_CSS = `@page { size: A4; margin: 0; }
@media print {
  [data-pdf-page] { break-after: page; break-inside: avoid; }
  [data-pdf-page]:last-child { break-after: auto; }
}`;

/**
 * Root of a PDF template: sets language and direction, the print fonts and the page rules.
 * Pages sit one under another on screen and one per sheet in print.
 */
export function PdfDocument({
  locale,
  children,
}: {
  locale: TemplateLocale;
  children: React.ReactNode;
}) {
  const fonts = PDF_FONTS[locale.lang];
  return (
    <PdfContext.Provider value={{ locale, serif: fonts.serif }}>
      <div
        data-pdf-document=""
        dir={locale.dir}
        lang={locale.lang}
        style={{ fontFamily: fonts.sans }}
        className="flex w-[210mm] flex-col gap-[8mm] bg-transparent text-[9pt] leading-[1.45] tabular-nums text-[#0B0B0B] [print-color-adjust:exact] print:gap-0"
      >
        <style>{DOCUMENT_CSS}</style>
        {children}
      </div>
    </PdfContext.Provider>
  );
}

export function PdfLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { locale } = usePdf();
  return <p className={cn(pdfLabelClass(locale), className)}>{children}</p>;
}

/**
 * One A4 page: the black band with the gold logo and the document's title and reference, a thin
 * gold rule, the body, and a footer with legal details and the page number.
 */
export function PdfPage({
  title,
  reference,
  details,
  footer,
  watermark,
  page,
  pages,
  children,
}: {
  /** Kind of document, in the band */
  title: string;
  reference: string;
  /** Extra lines under the reference, such as issue and due dates */
  details?: React.ReactNode;
  /** Legal details printed at the bottom of every page */
  footer: React.ReactNode;
  /** Large diagonal word across the page, such as "Pro-forma" */
  watermark?: string | undefined;
  page: number;
  pages: number;
  children: React.ReactNode;
}) {
  const { locale, serif } = usePdf();
  return (
    <section
      data-pdf-page=""
      className="relative flex h-[297mm] w-[210mm] shrink-0 flex-col overflow-hidden bg-white shadow-2xl print:shadow-none"
    >
      <header className="flex shrink-0 items-center justify-between gap-[6mm] bg-[#0B0B0B] px-[14mm] py-[6mm]">
        <LogoHorizontal size="md" />
        <div className="min-w-0 space-y-[0.6mm] text-end">
          <p
            className={cn(
              "text-[8.5pt] font-semibold text-[#D4AF37]",
              locale.dir === "ltr" && "uppercase tracking-[0.2em]",
            )}
            style={{ fontFamily: serif }}
          >
            {title}
          </p>
          <p className="font-mono text-[10pt] font-semibold text-[#F8F9FA]">{reference}</p>
          {details && (
            <div className="space-y-[0.4mm] text-[7.5pt] text-[#F8F9FA]/75">{details}</div>
          )}
        </div>
      </header>
      <div className="h-[0.7mm] shrink-0 bg-[#D4AF37]" />

      {watermark && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
        >
          <span
            className="-rotate-[28deg] select-none whitespace-nowrap text-[72pt] font-bold text-[#D4AF37]/15"
            style={{ fontFamily: serif }}
          >
            {watermark}
          </span>
        </span>
      )}

      <main className="flex min-h-0 flex-1 flex-col gap-[5mm] px-[14mm] py-[8mm]">{children}</main>

      <footer className="mx-[14mm] mb-[7mm] flex shrink-0 items-end justify-between gap-[6mm] border-t-[0.3mm] border-[#D4AF37] pt-[2.5mm] text-[7pt] leading-[1.5] text-[#0B0B0B]/60">
        <div className="min-w-0">{footer}</div>
        <p className="shrink-0 font-medium">{locale.t("pdf.page", { page, total: pages })}</p>
      </footer>
    </section>
  );
}

/** A block of a page under a serif heading, separated from the one above by a thin gold rule. */
export function PdfSection({
  title,
  children,
  className,
}: {
  title?: string | undefined;
  children: React.ReactNode;
  className?: string;
}) {
  const { serif } = usePdf();
  return (
    <section
      className={cn(
        "not-first:border-t-[0.3mm] not-first:border-[#D4AF37] not-first:pt-[4mm]",
        className,
      )}
    >
      {title && (
        <h2 className="mb-[2.5mm] text-[12pt] font-semibold" style={{ fontFamily: serif }}>
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

/** Paid or overdue mark at the foot of an invoice. */
export function PdfStamp({
  tone,
  children,
}: {
  tone: "paid" | "overdue";
  children: React.ReactNode;
}) {
  return (
    <p
      className={cn(
        "inline-block self-start rounded-[1mm] border-[0.5mm] px-[3mm] py-[1.5mm] text-[8pt] font-bold",
        tone === "paid" ? "border-[#A2E8DD] bg-[#A2E8DD]/30" : "border-[#8B002B] text-[#8B002B]",
      )}
    >
      {children}
    </p>
  );
}

/** Where and how to pay by bank transfer. */
export function PdfPaymentBox({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: React.ReactNode; mono?: boolean }[];
}) {
  return (
    <section className="break-inside-avoid space-y-[1.5mm] rounded-[1.5mm] border border-[#D4AF37]/70 bg-[#D4AF37]/10 p-[4mm] text-[8.5pt]">
      <p className="font-semibold">{title}</p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-[5mm] gap-y-[1mm]">
        {rows.map((row) => (
          <React.Fragment key={row.label}>
            <dt className="text-[#0B0B0B]/60">{row.label}</dt>
            <dd dir={row.mono ? "ltr" : "auto"} className={cn(row.mono && "font-mono text-end")}>
              {row.value}
            </dd>
          </React.Fragment>
        ))}
      </dl>
    </section>
  );
}

/** Registered company details on one or two lines, for the foot of every page. */
export function PdfLegalFooter({
  name,
  address,
  identifiers,
  note,
}: {
  name: string;
  address?: string;
  identifiers: { label: string; value: string | undefined }[];
  note?: string | undefined;
}) {
  const filled = identifiers.filter((item) => item.value);
  return (
    <>
      <p dir="auto" className="font-semibold text-[#0B0B0B]/75 rtl:text-right">
        {name}
        {address ? <span className="font-normal"> · {address}</span> : null}
      </p>
      {filled.length > 0 && (
        <p className="flex flex-wrap gap-x-[3mm]">
          {filled.map((item) => (
            <span key={item.label} dir="ltr" className="whitespace-nowrap">
              {item.label} <span className="font-mono">{item.value}</span>
            </span>
          ))}
        </p>
      )}
      {note && <p className="italic text-[#8C6B14]">{note}</p>}
    </>
  );
}
