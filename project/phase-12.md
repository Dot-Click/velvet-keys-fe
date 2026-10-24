Create reusable, brand-consistent document and email templates (frontend only, as React components) for a future backend to use.

PDF TEMPLATES (src/templates/pdf), all available in EN/FR/AR with RTL support for Arabic
1. Subscription invoice: Velvet Keys → client (from Phase 9; consolidate into one component).
2. Rent invoice: manager issuer profile → tenant.
3. Owner financial report.

Shared PDF rules:
- A4, black header band with the gold LogoHorizontal
- Thin gold rules between sections
- Serif headings, tabular numerals
- Print-friendly body: white background, dark text
- Page numbers and a footer with legal details

EMAIL TEMPLATES (src/templates/email), built with react-email, EN/FR/AR
1. Invitation (owner / conciergerie / tenant)
2. Password reset
3. Invoice issued
4. Payment reminder (day 5)
5. Account read-only notice (day 8)
6. Payment confirmed / access restored
7. Lease renewal alert (to the manager)
8. Rent invoice (to the tenant)

Shared email style: dark header with LogoMark, one clear gold CTA button, short copy, footer.

PREVIEW
Add a dev-only route /dev/templates (behind import.meta.env.DEV) to preview every template in every language.

BOUNDARY
Only the templates and the preview route.