import { endOfMonth, isSameDay, startOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { parseDay } from "@/lib/dates";
import type { StatementView } from "@/types/analytics";
import type { ISODate } from "@/types/common";
import type { CompanyLegal } from "@/types/billing";
import { useTemplateLocale } from "../shared/locale";
import type { TemplateLang, TemplateLocale } from "../shared/locale";
import { usePdf } from "./context";
import { paginate } from "./paginate";
import { PdfDocument, PdfLabel, PdfLegalFooter, PdfPage, PdfSection } from "./primitives";
import { PDF_TD, PDF_TH, companyLegalIdentifiers } from "./styles";

/**
 * Property rows per A4 page, measured on an 11.1 mm row (name over city): page one has room for
 * about 5 after the summary and profit and loss, a later page for about 20, and the total row and
 * notes on the last page take the room of 4 rows.
 */
const CAPACITY = { firstPage: 5, nextPage: 19, closing: 4 } as const;

export interface OwnerReportData {
  owner: { name: string };
  statement: StatementView;
  /** Self-managed owners pay no conciergerie commission, so their report leaves it out */
  solo: boolean;
  /** Adds the breakdown by property to the summary */
  detailed: boolean;
  /** Reference printed in the band, e.g. "VK-202609" */
  reference: string;
  issuedAt: ISODate;
  /** The platform's legal details, printed in the footer */
  legal: CompanyLegal;
}

export interface OwnerReportPdfProps {
  data: OwnerReportData;
  /** Language of the document; the app's current language when left out */
  lang?: TemplateLang;
}

/** "September 2026" for a whole month, otherwise "1 Sep 2026 – 15 Sep 2026". */
function periodLabel(locale: TemplateLocale, from: ISODate, to: ISODate) {
  const start = parseDay(from);
  const wholeMonth =
    isSameDay(start, startOfMonth(start)) && isSameDay(parseDay(to), endOfMonth(start));
  return wholeMonth
    ? locale.formatMonth(from.slice(0, 7))
    : `${locale.formatDate(from)} – ${locale.formatDate(to)}`;
}

/**
 * The financial report an owner receives for a period: summary figures, a profit and loss
 * statement and, in the detailed version, the breakdown by property.
 */
export function OwnerReportPdf({ data, lang }: OwnerReportPdfProps) {
  const locale = useTemplateLocale(lang);
  const { t } = locale;
  const { statement, solo, detailed } = data;
  const period = periodLabel(locale, statement.from, statement.to);
  const rows = detailed ? statement.rows : [];
  const pages = paginate(rows, detailed ? CAPACITY : { firstPage: 99, nextPage: 99, closing: 0 });

  return (
    <PdfDocument locale={locale}>
      {pages.map((chunk, index) => (
        <PdfPage
          key={index}
          page={index + 1}
          pages={pages.length}
          title={t(detailed ? "pdf.ownerReport.title" : "pdf.ownerReport.titleSummary")}
          reference={data.reference}
          details={
            <>
              <p>{period}</p>
              <p>{t("pdf.ownerReport.confidential")}</p>
            </>
          }
          footer={
            <>
              <PdfLegalFooter
                name={data.legal.name || locale.brand}
                address={data.legal.address}
                identifiers={companyLegalIdentifiers(locale, data.legal)}
              />
              <p>{t("pdf.ownerReport.generatedOn", { date: locale.formatDate(data.issuedAt) })}</p>
            </>
          }
        >
          {index === 0 && (
            <>
              <Overview locale={locale} data={data} period={period} />
              <Summary locale={locale} data={data} />
              <Statement locale={locale} data={data} />
            </>
          )}
          {detailed && (
            <Breakdown
              locale={locale}
              data={data}
              rows={chunk}
              first={index === 0}
              last={index === pages.length - 1}
            />
          )}
          {index === pages.length - 1 && <Notes locale={locale} solo={solo} detailed={detailed} />}
        </PdfPage>
      ))}
    </PdfDocument>
  );
}

function Overview({
  locale,
  data,
  period,
}: {
  locale: TemplateLocale;
  data: OwnerReportData;
  period: string;
}) {
  const { t } = locale;
  const { serif } = usePdf();
  const fields = [
    { label: t("pdf.ownerReport.preparedFor"), value: data.owner.name },
    { label: t("pdf.ownerReport.period"), value: period },
    {
      label: t("pdf.ownerReport.properties"),
      value: locale.formatNumber(data.statement.rows.length),
    },
    { label: t("pdf.ownerReport.cities"), value: locale.formatList(data.statement.cities) },
  ];
  return (
    <PdfSection>
      <div className="grid grid-cols-4 gap-[5mm]">
        {fields.map((field) => (
          <div key={field.label} className="min-w-0 space-y-[0.8mm]">
            <PdfLabel>{field.label}</PdfLabel>
            <p
              dir="auto"
              className="text-[10.5pt] font-semibold rtl:text-right"
              style={{ fontFamily: serif }}
            >
              {field.value}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-[3mm] text-[8.5pt] text-[#0B0B0B]/70">{t("pdf.ownerReport.intro")}</p>
    </PdfSection>
  );
}

function Summary({ locale, data }: { locale: TemplateLocale; data: OwnerReportData }) {
  const { t } = locale;
  const { pl } = data.statement;
  const operating = pl.payroll + pl.utilities + pl.repairs;
  const commissionShare = pl.grossRevenue > 0 ? (pl.commission / pl.grossRevenue) * 100 : 0;
  const margin = pl.grossRevenue > 0 ? (pl.netProfit / pl.grossRevenue) * 100 : 0;
  const tiles = [
    {
      label: t("pdf.ownerReport.grossRevenue"),
      value: pl.grossRevenue,
      note: t("pdf.ownerReport.grossRevenueNote"),
    },
    ...(data.solo
      ? []
      : [
          {
            label: t("pdf.ownerReport.commission"),
            value: pl.commission,
            note: t("pdf.ownerReport.commissionNote", {
              share: locale.formatPercent(commissionShare),
            }),
          },
        ]),
    {
      label: t("pdf.ownerReport.operatingCosts"),
      value: operating,
      note: t("pdf.ownerReport.operatingCostsNote"),
    },
    {
      label: t("pdf.ownerReport.netProfit"),
      value: pl.netProfit,
      note: t("pdf.ownerReport.netProfitNote", { margin: locale.formatPercent(margin) }),
      highlight: true,
    },
  ];
  return (
    <PdfSection title={t("pdf.ownerReport.summaryTitle")}>
      <div className={cn("grid gap-[3mm]", tiles.length === 4 ? "grid-cols-4" : "grid-cols-3")}>
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className={cn(
              "min-w-0 space-y-[1mm] rounded-[1.2mm] border p-[3mm]",
              tile.highlight ? "border-[#D4AF37] bg-[#D4AF37]/10" : "border-[#0B0B0B]/15 bg-white",
            )}
          >
            <PdfLabel>{tile.label}</PdfLabel>
            <p className="text-[11pt] font-bold">{locale.formatMAD(tile.value)}</p>
            <p className="text-[7pt] text-[#0B0B0B]/60">{tile.note}</p>
          </div>
        ))}
      </div>
    </PdfSection>
  );
}

function Statement({ locale, data }: { locale: TemplateLocale; data: OwnerReportData }) {
  const { t } = locale;
  const { pl } = data.statement;
  type Line = { label: string; amount: number; kind: "plain" | "deduction" | "total" | "net" };
  const lines: Line[] = [
    { label: t("pdf.ownerReport.lineStr"), amount: pl.strRevenue, kind: "plain" },
    { label: t("pdf.ownerReport.lineLtr"), amount: pl.ltrRevenue, kind: "plain" },
    { label: t("pdf.ownerReport.lineGross"), amount: pl.grossRevenue, kind: "total" },
    ...(data.solo
      ? []
      : [
          {
            label: t("pdf.ownerReport.lineCommission"),
            amount: pl.commission,
            kind: "deduction" as const,
          },
        ]),
    { label: t("pdf.ownerReport.linePayroll"), amount: pl.payroll, kind: "deduction" },
    { label: t("pdf.ownerReport.lineUtilities"), amount: pl.utilities, kind: "deduction" },
    { label: t("pdf.ownerReport.lineRepairs"), amount: pl.repairs, kind: "deduction" },
    { label: t("pdf.ownerReport.lineNet"), amount: pl.netProfit, kind: "net" },
  ];
  return (
    <PdfSection title={t("pdf.ownerReport.statementTitle")}>
      <table className="w-full text-[8.5pt]">
        <thead>
          <tr>
            <th scope="col" className={PDF_TH}>
              {t("pdf.ownerReport.colLine")}
            </th>
            <th scope="col" className={cn(PDF_TH, "text-end")}>
              {t("pdf.ownerReport.colAmount")}
            </th>
            <th scope="col" className={cn(PDF_TH, "w-[28mm] text-end")}>
              {t("pdf.ownerReport.colShare")}
            </th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => {
            const strong = line.kind === "total" || line.kind === "net";
            const share = pl.grossRevenue > 0 ? (line.amount / pl.grossRevenue) * 100 : 0;
            return (
              <tr
                key={line.label}
                className={cn(strong && "font-semibold", line.kind === "net" && "bg-[#D4AF37]/10")}
              >
                <td className={cn(PDF_TD, "py-[1.6mm]", line.kind === "deduction" && "ps-[4mm]")}>
                  {line.label}
                </td>
                <td className={cn(PDF_TD, "whitespace-nowrap py-[1.6mm] text-end")}>
                  <span dir="ltr">
                    {line.kind === "deduction" ? "−" : ""}
                    {locale.formatMAD(line.amount)}
                  </span>
                </td>
                <td
                  className={cn(PDF_TD, "whitespace-nowrap py-[1.6mm] text-end text-[#0B0B0B]/60")}
                >
                  {locale.formatPercent(share)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </PdfSection>
  );
}

function Breakdown({
  locale,
  data,
  rows,
  first,
  last,
}: {
  locale: TemplateLocale;
  data: OwnerReportData;
  rows: StatementView["rows"];
  first: boolean;
  last: boolean;
}) {
  const { t } = locale;
  const { pl } = data.statement;
  const cell = "py-[1.6mm] text-end whitespace-nowrap";
  return (
    <PdfSection title={first ? t("pdf.ownerReport.breakdownTitle") : undefined}>
      <table className="w-full text-[8pt]">
        <thead>
          <tr>
            <th scope="col" className={PDF_TH}>
              {t("pdf.ownerReport.colProperty")}
            </th>
            {[
              "colStr",
              "colLtr",
              "colGross",
              ...(data.solo ? [] : ["colCommission"]),
              "colOccupancy",
              "colNet",
            ].map((key) => (
              <th key={key} scope="col" className={cn(PDF_TH, "text-end")}>
                {t(`pdf.ownerReport.${key}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.property.id}>
              <td className={cn(PDF_TD, "py-[1.6mm]")}>
                <span dir="auto" className="block font-medium rtl:text-right">
                  {row.property.name}
                </span>
                <span dir="auto" className="block text-[7pt] text-[#0B0B0B]/55 rtl:text-right">
                  {row.property.city}
                </span>
              </td>
              <td className={cn(PDF_TD, cell)}>{locale.formatMAD(row.pl.strRevenue, 0)}</td>
              <td className={cn(PDF_TD, cell)}>{locale.formatMAD(row.pl.ltrRevenue, 0)}</td>
              <td className={cn(PDF_TD, cell)}>{locale.formatMAD(row.pl.grossRevenue, 0)}</td>
              {!data.solo && (
                <td className={cn(PDF_TD, cell)}>
                  <span dir="ltr">−{locale.formatMAD(row.pl.commission, 0)}</span>
                </td>
              )}
              <td className={cn(PDF_TD, cell)}>
                {row.strUnits > 0 ? locale.formatPercent(row.pl.strOccupancy, 0) : "—"}
              </td>
              <td className={cn(PDF_TD, cell, "font-semibold")}>
                {locale.formatMAD(row.pl.netProfit, 0)}
              </td>
            </tr>
          ))}
        </tbody>
        {last && (
          <tfoot>
            <tr className="font-bold">
              <td className="pt-[2mm]">{t("pdf.ownerReport.total")}</td>
              <td className={cn("pt-[2mm] text-end whitespace-nowrap")}>
                {locale.formatMAD(pl.strRevenue, 0)}
              </td>
              <td className="pt-[2mm] text-end whitespace-nowrap">
                {locale.formatMAD(pl.ltrRevenue, 0)}
              </td>
              <td className="pt-[2mm] text-end whitespace-nowrap">
                {locale.formatMAD(pl.grossRevenue, 0)}
              </td>
              {!data.solo && (
                <td className="pt-[2mm] text-end whitespace-nowrap">
                  <span dir="ltr">−{locale.formatMAD(pl.commission, 0)}</span>
                </td>
              )}
              <td className="pt-[2mm] text-end whitespace-nowrap">
                {locale.formatPercent(pl.strOccupancy, 0)}
              </td>
              <td className="pt-[2mm] text-end whitespace-nowrap">
                {locale.formatMAD(pl.netProfit, 0)}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </PdfSection>
  );
}

function Notes({
  locale,
  solo,
  detailed,
}: {
  locale: TemplateLocale;
  solo: boolean;
  detailed: boolean;
}) {
  const { t } = locale;
  return (
    <PdfSection title={t("pdf.ownerReport.notesTitle")}>
      <ul className="list-disc space-y-[1mm] ps-[4mm] text-[7.5pt] text-[#0B0B0B]/65">
        <li>{t("pdf.ownerReport.noteNet")}</li>
        {solo && <li>{t("pdf.ownerReport.noteSolo")}</li>}
        {detailed && <li>{t("pdf.ownerReport.noteOccupancy")}</li>}
      </ul>
    </PdfSection>
  );
}
