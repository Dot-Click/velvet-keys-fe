Add the long-term rental module to the Conciergerie panel (also visible in the solo Owner's "Operations" section).

1. LEASES (/conciergerie/leases)
- Filter chips: Active / Ending soon (≤60 days) / Ended / Late rent.
- Lease cards (or table on desktop): unit image, unit name, tenant name, period, monthly rent MAD, next due date, rent status pill (paid jade / unpaid gold / late ruby).
- "New lease" multi-step drawer:
  1. Unit (LTR units without an active lease only)
  2. Tenant (pick existing or create: name, email, phone, language)
  3. Terms: start/end date (custom date range picker), monthly rent, deposit, rent due day
  4. Contract upload (PDF, drag & drop, preview)
  5. Review, then create. Tenant invite is sent (mock toast).
- Lease detail page:
  - Terms, contract preview/download, tenant card with a "Resend invite" action
  - Rent schedule table: month, amount, due date, status, "Mark received" action, invoice PDF link
  - Actions: renew (extend end date + optional new rent), end lease
  - Renewal alert banner when ≤60 days remain

2. RENT INVOICES (/conciergerie/rent-invoices)
- All rent invoices across leases: period, tenant, unit, amount, status, due date, PDF.
- "Generate this month's invoices" button that creates invoices for every active lease (mock).
- Invoice PDF preview modal:
  - Issuer profile details (name, address, ICE if set, RIB)
  - Tenant, unit, period, amount
  - Brand-styled in the user's language

3. INVOICE ISSUER PROFILE (/conciergerie/settings/issuer)
- Form: name, address, ICE (optional), RIB.
- Live preview of the invoice header beside the form.
- Warning banner on Rent invoices if the profile is incomplete.

All write actions respect read-only mode.

BOUNDARY
Only Leases, Rent invoices and the Issuer settings page.