# Templates

Documents and emails as React components, so a backend can render them without a design of its own.
Everything is in English, French and Arabic; Arabic is right-to-left. Strings live in
`src/locales/*/templates.json`, plus the `billing` and `conciergerie` namespaces for the invoices.

Preview every template in every language at `/dev/templates` (development only).

## PDF (`pdf/`)

| Template | Props | Used by |
| --- | --- | --- |
| `SubscriptionInvoicePdf` | `invoice`, `context`, `lang?` | Billing and Admin invoice previews, backend |
| `RentInvoicePdf` | `row`, `lang?` | backend |
| `OwnerReportPdf` | `data`, `lang?` | backend |

- A4 pages of exactly 210 × 297 mm with no margin: black band with the gold `LogoHorizontal`, thin gold
  rules between sections, serif headings, tabular numerals, white body, page numbers and a footer with
  the issuer's legal details.
- Long tables are split over pages by `paginate` using row capacities measured on real rows
  (see each template). The last page always carries the totals, so they are never clipped.
- Leave `lang` out on screen to follow the app's language; pass it to pin one (a server should).
- The layout uses the app's Tailwind classes and Google Fonts. To get a file, render the component in a
  page that loads the app's stylesheet and print it with a headless browser (`@page` is already set to A4
  with no margin). `PdfPreview` shows pages scaled to fit on screen and prints them at full size.

## Email (`email/`)

Built with `@react-email/components`. Each template has a component and a `…EmailSubject(props)`:

```ts
import { InvitationEmail, invitationEmailSubject, renderEmailHtml, renderEmailText } from "@/templates";

const props = { lang: "fr", assetBaseUrl: "https://app.example.com", role: "tenant", /* … */ };
const subject = invitationEmailSubject(props);
const html = await renderEmailHtml(<InvitationEmail {...props} />);
const text = await renderEmailText(<InvitationEmail {...props} />);
```

- `assetBaseUrl` is where `public/email/logo-mark.png` is served (mail clients drop SVG and cannot
  load relative paths). Pass the platform's legal details as `legal` for the footer.
- Styles are inline and the layout is tables, as mail clients need. Arabic sets `dir="rtl"` and
  swaps alignment by hand, because mail clients ignore logical CSS properties.
