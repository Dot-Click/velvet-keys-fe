Do a full UI/UX QA pass across all 4 panels, the auth pages and the landing page. Fix issues only — no new features.

CHECKLIST
1. RTL: every screen in AR mirrors correctly — no left/right CSS, icons flipped, tables aligned, charts readable.
2. i18n: no hard-coded strings; no text overflow in FR (longer words) or AR.
3. Responsive: 360px, 768px, 1280px, 1440px+. No horizontal scroll. Tables become cards on mobile.
4. States: every list and screen has empty, loading and error states with line-art illustrations.
5. Read-only mode: every write action is disabled with a tooltip when the account is read-only.
6. Role isolation: each mock account only sees its own nav and data; direct URLs to other panels redirect.
7. Money and dates: all money goes through formatMAD(), all dates through the locale formatter.
8. Accessibility: focus states, keyboard navigation for drawers and modals, contrast ≥ 4.5:1, aria labels on icon buttons, prefers-reduced-motion respected.
9. Performance: lazy-load each panel's routes, compress images, no layout shift on load.
10. Consistency: the same component is used for the same pattern everywhere (drawers, status pills, tables, KPI cards).

Output a short list of what was fixed.