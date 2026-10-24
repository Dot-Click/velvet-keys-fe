Complete the Admin panel.

1. INVOICES (/admin/invoices)
- Table of all subscription invoices: number, client, period, total, status, due date, days overdue.
- Filter chips: Sent / Overdue / Paid / Pro-forma.
- "Mark as paid" action:
  - Modal with payment date, bank reference and a note
  - Marking paid restores the client's account from read-only to active, with a confirmation toast
- Invoice detail: the same PDF preview as Phase 9, plus a status timeline (issued → reminder sent day 5 → read-only day 8 → paid).

2. REVENUE (/admin/revenue)
- Monthly bar chart: billed vs collected (gold vs jade), last 12 months.
- Table by month with the breakdown: STR, LTR, sync, VAT.

3. PRICING & OFFERS (/admin/pricing)
- Editable price cards: STR, LTR, sync (MAD excl. VAT). Saving requires a confirm modal: "Applies to new billing periods only."
- Price history list.
- Launch offer settings: deadline date/time (Casablanca timezone), and a read-only table of the offer rules.
- Free sync: total slots (editable, default 200), used count, list of units using free slots.

4. SETTINGS (/admin/settings)
- Company legal details form: company name, address, ICE, IF, RC, Patente, RIB.
- Banner: "Invoices are issued as PRO-FORMA until all legal details are filled in."
- Live invoice header preview.
- Billing rules display (read-only): due in 7 days, reminder day 5, read-only day 8.

BOUNDARY
Only these 4 Admin screens.