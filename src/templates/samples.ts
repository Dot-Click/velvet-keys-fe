import { addDays, addMonths, endOfMonth, startOfMonth } from "date-fns";
import { MOCK_ACCOUNTS } from "@/mocks/accounts";
import { MOCK_PLATFORM_SETTINGS, MOCK_SUBSCRIPTION_INVOICES } from "@/mocks/billing";
import { ACCOUNT_IDS, USER_IDS } from "@/mocks/ids";
import { MOCK_LEASES, MOCK_RENT_INVOICES, MOCK_TENANTS } from "@/mocks/leases";
import { MOCK_USERS_DATA } from "@/mocks/users";
import { analyticsService } from "@/services/analytics-service";
import { rentInvoicesService } from "@/services/leases-service";
import { today } from "@/lib/clock";
import { toISODate, toMonthKey } from "@/lib/dates";
import type { StatementView } from "@/types/analytics";
import type { CompanyLegal, InvoiceDocumentContext, SubscriptionInvoice } from "@/types/billing";
import type { RentInvoiceRow } from "@/types/lease";

/** Sample legal details with every field filled in, so a sample invoice can be final. */
export const SAMPLE_LEGAL: CompanyLegal = {
  ...MOCK_PLATFORM_SETTINGS.companyLegal,
  ice: "001234567000089",
  if: "40112233",
  rc: "334455",
  patente: "31002299",
};

/** The platform's bank details as the emails print them. */
export const SAMPLE_BANK = {
  beneficiary: SAMPLE_LEGAL.name,
  rib: SAMPLE_LEGAL.rib,
};

/** Data the PDF previews need, assembled once from the app's mock data. */
export interface TemplateSamples {
  invoice: SubscriptionInvoice;
  /** Context with the platform's real (incomplete) legal details: the invoice is pro-forma */
  proFormaContext: InvoiceDocumentContext;
  /** Context with every legal field filled in */
  finalContext: InvoiceDocumentContext;
  rentRow: RentInvoiceRow;
  managedStatement: StatementView;
  soloStatement: StatementView;
  managedOwner: string;
  soloOwner: string;
}

/** The mock invoice with the most lines, so the sample shows prorating and launch-offer lines. */
function richestInvoice(): SubscriptionInvoice {
  const invoices = MOCK_SUBSCRIPTION_INVOICES.filter(
    (invoice) => invoice.accountId === ACCOUNT_IDS.atlas,
  );
  return [...invoices].sort((a, b) => b.lines.length - a.lines.length)[0] as SubscriptionInvoice;
}

function context(companyLegal: CompanyLegal): InvoiceDocumentContext {
  const account = MOCK_ACCOUNTS.find((item) => item.id === ACCOUNT_IDS.atlas);
  const holder = MOCK_USERS_DATA.find((user) => user.id === USER_IDS.conciergerie);
  return {
    account: {
      name: account?.name ?? "Atlas Conciergerie",
      ...(account?.issuerProfile ? { issuerProfile: account.issuerProfile } : {}),
    },
    holder: { name: holder?.name ?? "", email: holder?.email ?? "" },
    companyLegal,
    vatRate: MOCK_PLATFORM_SETTINGS.vatRate,
  };
}

export async function loadTemplateSamples(): Promise<TemplateSamples> {
  const lastMonth = startOfMonth(addMonths(today(), -1));
  const range = { from: toISODate(lastMonth), to: toISODate(endOfMonth(lastMonth)) };
  const atlasTenants = new Set(
    MOCK_TENANTS.filter((tenant) => tenant.accountId === ACCOUNT_IDS.atlas).map(
      (tenant) => tenant.id,
    ),
  );
  const atlasLeases = new Set(
    MOCK_LEASES.filter((lease) => atlasTenants.has(lease.tenantId)).map((lease) => lease.id),
  );
  const rentInvoice =
    MOCK_RENT_INVOICES.find((invoice) => atlasLeases.has(invoice.leaseId)) ?? MOCK_RENT_INVOICES[0];

  const [managedStatement, soloStatement, rentRow] = await Promise.all([
    analyticsService.getStatement({ accountId: ACCOUNT_IDS.atlas, ownerId: USER_IDS.owner }, range),
    analyticsService.getStatement({ accountId: ACCOUNT_IDS.benali }, range),
    rentInvoicesService.getRow({ accountId: ACCOUNT_IDS.atlas }, rentInvoice?.id ?? ""),
  ]);

  return {
    invoice: richestInvoice(),
    proFormaContext: context(MOCK_PLATFORM_SETTINGS.companyLegal),
    finalContext: context(SAMPLE_LEGAL),
    rentRow,
    managedStatement,
    soloStatement,
    managedOwner: MOCK_USERS_DATA.find((user) => user.id === USER_IDS.owner)?.name ?? "",
    soloOwner: MOCK_USERS_DATA.find((user) => user.id === USER_IDS.soloOwner)?.name ?? "",
  };
}

/** The same figures with every row repeated, to show a statement running over several pages. */
export function repeatStatementRows(statement: StatementView, times: number): StatementView {
  return {
    ...statement,
    rows: Array.from({ length: times }, (_, copy) =>
      statement.rows.map((row) => ({
        ...row,
        property: { ...row.property, id: `${row.property.id}-${copy}` },
      })),
    ).flat(),
  };
}

/** Dates relative to today, so a sample always looks current. */
export function sampleDay(offset: number) {
  return toISODate(addDays(today(), offset));
}

export function sampleMonth(offset: number) {
  return toMonthKey(addMonths(today(), offset));
}

export function sampleInstant(offsetDays: number) {
  return `${sampleDay(offsetDays)}T23:59:00+01:00`;
}
