Build the Admin panel shell and the client-management screens (/admin).

STYLE
Same tokens, but denser and more data-forward than the other panels: compact tables, 13–14px body text, gold accents only for key figures. Sidebar sections: Overview, Clients, Properties, Invoices, Pricing & offers, Settings.

1. OVERVIEW (/admin)
- KPI strip: active clients, total units (STR / LTR / synced), MRR excl. VAT, this month billed vs collected, overdue count.
- Free sync slots meter: "142 / 200 used".
- Alerts list: clients whose free period ends within 7 days; overdue invoices; read-only accounts.

2. CLIENTS (/admin/clients)
- Table: name, type (Owner / Conciergerie), signup date, units STR / LTR / synced, offer type, free-month end dates, account status (active / read-only / banned), language.
- Filters (type, status, offer) and search.
- Client detail page:
  - Profile, units summary, offer timeline
  - Invoices tab, properties tab, users tab (their owners and tenants)
  - Actions: grant manual offer (free months per product + required reason field), ban / unban (confirm modal with reason)

3. PROPERTIES (/admin/properties)
- All properties platform-wide: name, client, city, units, status.
- Delist / relist actions (confirm modal with reason). Delisted properties show a muted ruby "Delisted" badge.

BOUNDARY
Only the Admin shell, Overview, Clients and Properties.