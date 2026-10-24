import { describe, expect, it } from "vitest";
import {
  calcBilled,
  calcCollected,
  calcCollectionRate,
  calcMRR,
  calcOutstanding,
  calcOverdue,
} from "@/lib/billingMetrics";
import { invoiceSteps, checkCompanyLegal, normalizeCompanyLegal } from "@/lib/admin";
import { casablancaDateTime, casablancaParts } from "@/lib/dates";
import {
  digitsOnly,
  formatRib,
  isValidIce,
  isValidRib,
  ICE_DIGITS,
  RIB_DIGITS,
} from "@/lib/issuer";
import type { CompanyLegal, SubscriptionInvoice } from "@/types/billing";

describe("billingMetrics", () => {
  it("calcMRR sums estimate subtotals excluding VAT", () => {
    expect(calcMRR([])).toBe(0);
    expect(calcMRR([{ subtotal: 150.25 }, { subtotal: 249.75 }, { subtotal: 0 }])).toBe(400);
  });

  it("calcBilled sums all non-draft invoice totals including VAT", () => {
    const invoices = [
      { status: "draft", total: 100, issuedAt: "2026-03-01" },
      { status: "sent", total: 200, issuedAt: "2026-03-05" },
      { status: "paid", total: 300, issuedAt: "2026-03-10" },
      { status: "overdue", total: 150, issuedAt: "2026-02-01" },
      { status: "free", total: 0, issuedAt: "2026-03-01" },
    ] as const;

    expect(calcBilled(invoices)).toBe(650);
    expect(calcBilled(invoices, "2026-03")).toBe(500);
    expect(calcBilled(invoices, "2026-02")).toBe(150);
  });

  it("calcCollected sums only paid invoices", () => {
    const invoices = [
      { status: "paid", total: 300, issuedAt: "2026-03-01" },
      { status: "paid", total: 200.5, issuedAt: "2026-03-15" },
      { status: "sent", total: 100, issuedAt: "2026-03-10" },
      { status: "overdue", total: 400, issuedAt: "2026-02-10" },
    ] as const;

    expect(calcCollected(invoices)).toBe(500.5);
    expect(calcCollected(invoices, "2026-03")).toBe(500.5);
    expect(calcCollected(invoices, "2026-02")).toBe(0);
  });

  it("calcOutstanding sums only sent and overdue invoices (free excluded)", () => {
    const invoices = [
      { status: "draft", total: 500, issuedAt: "2026-03-01" },
      { status: "free", total: 0, issuedAt: "2026-03-01" },
      { status: "paid", total: 200, issuedAt: "2026-03-01" },
      { status: "sent", total: 120, issuedAt: "2026-03-05" },
      { status: "overdue", total: 180, issuedAt: "2026-03-10" },
    ] as const;

    expect(calcOutstanding(invoices)).toBe(300);
    expect(calcOutstanding(invoices, "2026-03")).toBe(300);
    expect(calcOutstanding(invoices, "2026-04")).toBe(0);
  });

  it("calcOverdue returns count and sum of overdue invoices", () => {
    const invoices = [
      { status: "sent", total: 100, issuedAt: "2026-03-01" },
      { status: "overdue", total: 150.5, issuedAt: "2026-02-01" },
      { status: "overdue", total: 249.5, issuedAt: "2026-01-01" },
      { status: "paid", total: 300, issuedAt: "2026-02-01" },
    ] as const;

    expect(calcOverdue(invoices)).toEqual({ count: 2, amount: 400 });
  });

  it("calcCollectionRate computes ratio and handles zero billed gracefully", () => {
    expect(calcCollectionRate([])).toBe(1);

    const invoices = [
      { status: "paid", total: 400, issuedAt: "2026-03-01" },
      { status: "sent", total: 100, issuedAt: "2026-03-05" },
    ] as const;

    expect(calcCollectionRate(invoices)).toBe(0.8);
  });
});

describe("invoiceSteps", () => {
  it("handles free invoices (0 MAD): issued done, all subsequent steps skipped", () => {
    const freeInvoice: Pick<SubscriptionInvoice, "issuedAt" | "dueDate" | "status" | "paidAt"> = {
      issuedAt: "2026-03-01",
      dueDate: "2026-03-15",
      status: "free",
    };
    const now = new Date("2026-03-10T12:00:00Z");
    const steps = invoiceSteps(freeInvoice, now);

    expect(steps).toEqual([
      { key: "issued", state: "done", date: "2026-03-01" },
      { key: "reminder", state: "skipped", date: "2026-03-06" },
      { key: "readonly", state: "skipped", date: "2026-03-09" },
      { key: "paid", state: "skipped", date: "2026-03-01" },
    ]);
  });

  it("handles draft invoices: all steps pending", () => {
    const draftInvoice: Pick<SubscriptionInvoice, "issuedAt" | "dueDate" | "status" | "paidAt"> = {
      issuedAt: "2026-03-01",
      dueDate: "2026-03-15",
      status: "draft",
    };
    const now = new Date("2026-03-02T12:00:00Z");
    const steps = invoiceSteps(draftInvoice, now);

    expect(steps.map((s) => s.state)).toEqual(["pending", "pending", "pending", "pending"]);
  });

  it("handles freshly sent invoices before reminder date", () => {
    const sentInvoice: Pick<SubscriptionInvoice, "issuedAt" | "dueDate" | "status" | "paidAt"> = {
      issuedAt: "2026-03-01",
      dueDate: "2026-03-15",
      status: "sent",
    };
    const now = new Date("2026-03-03T12:00:00Z"); // Day 2
    const steps = invoiceSteps(sentInvoice, now);

    expect(steps.map((s) => s.state)).toEqual(["done", "pending", "pending", "pending"]);
  });

  it("handles overdue invoices past reminder and readonly triggers", () => {
    const overdueInvoice: Pick<SubscriptionInvoice, "issuedAt" | "dueDate" | "status" | "paidAt"> =
      {
        issuedAt: "2026-03-01",
        dueDate: "2026-03-15",
        status: "overdue",
      };
    const now = new Date("2026-03-20T12:00:00Z"); // Day 19
    const steps = invoiceSteps(overdueInvoice, now);

    expect(steps.map((s) => s.state)).toEqual(["done", "done", "done", "pending"]);
  });

  it("handles prompt paid invoices: skips reminder and readonly", () => {
    const promptPaid: Pick<SubscriptionInvoice, "issuedAt" | "dueDate" | "status" | "paidAt"> = {
      issuedAt: "2026-03-01",
      dueDate: "2026-03-15",
      status: "paid",
      paidAt: "2026-03-03", // paid before reminder (2026-03-06)
    };
    const now = new Date("2026-03-20T12:00:00Z");
    const steps = invoiceSteps(promptPaid, now);

    expect(steps).toEqual([
      { key: "issued", state: "done", date: "2026-03-01" },
      { key: "reminder", state: "skipped", date: "2026-03-06" },
      { key: "readonly", state: "skipped", date: "2026-03-09" },
      { key: "paid", state: "done", date: "2026-03-03" },
    ]);
  });

  it("handles late paid invoices: marks reminder and readonly as done if paid after them", () => {
    const latePaid: Pick<SubscriptionInvoice, "issuedAt" | "dueDate" | "status" | "paidAt"> = {
      issuedAt: "2026-03-01",
      dueDate: "2026-03-15",
      status: "paid",
      paidAt: "2026-03-12", // paid after readonly trigger (2026-03-09)
    };
    const now = new Date("2026-03-20T12:00:00Z");
    const steps = invoiceSteps(latePaid, now);

    expect(steps).toEqual([
      { key: "issued", state: "done", date: "2026-03-01" },
      { key: "reminder", state: "done", date: "2026-03-06" },
      { key: "readonly", state: "done", date: "2026-03-09" },
      { key: "paid", state: "done", date: "2026-03-12" },
    ]);
  });
});

describe("Casablanca time utilities", () => {
  it("formats standard date-time in Morocco (GMT+1)", () => {
    const iso = casablancaDateTime("2026-06-15", "14:30");
    expect(iso).toBe("2026-06-15T14:30:00+01:00");

    const parts = casablancaParts(iso);
    expect(parts).toEqual({
      day: "2026-06-15",
      time: "14:30",
      offset: "GMT+1",
    });
  });

  it("formats Ramadan date-time when Morocco reverts to GMT+0 (e.g. 2024-03-25)", () => {
    // During Ramadan 2024 (approx March 10 - April 9), Morocco shifted back to GMT+0
    const iso = casablancaDateTime("2024-03-25", "23:59");
    expect(iso).toBe("2024-03-25T23:59:00+00:00");

    const parts = casablancaParts("2024-03-25T12:00:00Z");
    expect(parts.day).toBe("2024-03-25");
    expect(parts.time).toBe("12:00");
    expect(parts.offset).toBe("GMT");
  });
});

describe("RIB and ICE formatters and company legal validation", () => {
  const validRibRaw = "007780000123456789012345";
  const validIceRaw = "012345678901234";

  it("extracts digits only", () => {
    expect(digitsOnly("007 780-000 1234.56789/012345")).toBe(validRibRaw);
  });

  it("validates RIB length and numeric content", () => {
    expect(isValidRib(validRibRaw)).toBe(true);
    expect(isValidRib("007 780 0001234567890123 45")).toBe(true);
    expect(isValidRib("123")).toBe(false);
    expect(isValidRib(validRibRaw + "1")).toBe(false);
    expect(isValidRib("ABC" + validRibRaw.slice(3))).toBe(false);
  });

  it("validates ICE length and numeric content", () => {
    expect(isValidIce(validIceRaw)).toBe(true);
    expect(isValidIce("012 345 678 901 234")).toBe(true);
    expect(isValidIce("12345")).toBe(false);
    expect(isValidIce(validIceRaw + "9")).toBe(false);
  });

  it("formats RIB into 3 3 16 2 digit groupings", () => {
    expect(formatRib(validRibRaw)).toBe("007 780 0001234567890123 45");
    expect(formatRib("invalid")).toBe("invalid");
  });

  it("validates company legal data with strict numeric rules for IF, RC, Patente", () => {
    const validLegal: CompanyLegal = {
      name: "Velvet Keys SARL",
      address: "12 Boulevard d'Anfa, Casablanca",
      ice: validIceRaw,
      if: "12345678",
      rc: "987654",
      patente: "11223344",
      rib: validRibRaw,
    };

    expect(checkCompanyLegal(validLegal)).toEqual({});

    const invalidLegal: CompanyLegal = {
      ...validLegal,
      if: "ABC-123", // Non-digits should fail
      ice: "123", // Short ICE
      rib: "007", // Short RIB
    };

    const issues = checkCompanyLegal(invalidLegal);
    expect(issues.if).toBe("invalid");
    expect(issues.ice).toBe("invalid");
    expect(issues.rib).toBe("invalid");
  });

  it("normalizes company legal formatting", () => {
    const legal: CompanyLegal = {
      name: "  Velvet Keys  ",
      address: "  Casablanca  ",
      ice: "  012 345 678 901 234  ",
      if: " 12345 ",
      rc: " 67890 ",
      patente: " 11223 ",
      rib: " 007780000123456789012345 ",
    };

    const normalized = normalizeCompanyLegal(legal);
    expect(normalized.name).toBe("Velvet Keys");
    expect(normalized.ice).toBe("012345678901234");
    expect(normalized.rib).toBe("007 780 0001234567890123 45");
  });
});
