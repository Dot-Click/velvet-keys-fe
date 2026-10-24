Build the subscription billing screen for account holders (Conciergerie and solo Owner) at /conciergerie/billing and /owner/billing. Use one shared component.

1. PLAN SUMMARY (top)
- Cards for:
  - STR units × 200 MAD
  - LTR units × 100 MAD
  - Synced units × 20 MAD
  - Estimated next invoice (from estimateNextInvoice()), excl. VAT, with VAT and total
- Show the prices from PlatformSettings — never hard-code them.

2. LAUNCH OFFER STATUS
An elegant card with:
- Offer type (e.g. "Full bundle: STR + Sync + LTR")
- Progress rings: "STR free month 1 of 2", "LTR free month 2 of 3", with end dates
- Free sync status: "Free sync until [date]" or "Free sync slots were full at signup"
- If the bundle is not complete before the deadline, a soft hint: "Add sync + LTR before 31 Jan 2027 to unlock a 3rd free LTR month".

3. INVOICES TABLE
- Columns: period, total incl. VAT, status (paid jade / sent gold / overdue ruby), due date.
- PDF preview modal:
  - Velvet Keys logo, company legal details (or a "PRO-FORMA" watermark if Admin hasn't filled them in)
  - Client details
  - Lines with day proration shown ("12 days × 200 MAD / 30")
  - Free months as 0 MAD lines labelled "Launch offer – free month X of Y"
  - Subtotal, VAT 20%, total, RIB, due date
  - In the user's language

4. HOW TO PAY
Bank transfer card: RIB with a copy button, invoice reference to include in the transfer, and the note "Payment is confirmed by our team within 1 business day".

5. OVERDUE / READ-ONLY
- Day 5 to day 7: gold banner "Invoice #… is due on [date]".
- Day 8+: the read-only ruby banner from Phase 3, linking here.
- Overdue invoices are pinned at the top with a ruby edge.

BOUNDARY
Only the Billing screen and the banners.