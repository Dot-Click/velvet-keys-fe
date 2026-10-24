Rebrand the app from "Happiness Experience" to "Velvet Keys". The uploaded image is the official logo.

LOGO DETAILS (recreate as clean SVG vectors, gold #D4AF37 with a subtle metallic gradient)

- Mark: a slim key. Its head is a circle with a thin double ring; inside the ring is a VK monogram with a small white/gold diamond where the V and K strokes meet. The shaft is a thin vertical line with 2 short teeth at the bottom.
- Wordmark: "VELVET KEYS" in a light geometric sans (use "Jost" weight 300 from Google Fonts), uppercase, letter-spacing 0.25em, Diamond White #F8F9FA.
- Tagline: "ABSOLUTE CONTROL" in Jost 400, small uppercase, gold, letter-spacing 0.3em, flanked by thin gold horizontal lines on both sides.

COMPONENTS (src/components/brand)

- <LogoMark/>: key only
- <LogoFull/>: mark, wordmark and tagline stacked vertically (for the login, splash and landing hero)
- <LogoHorizontal/>: mark on the left, wordmark on the right, no tagline (for sidebars and nav)
- <LogoPlaque/>: LogoFull on a dark walnut wood texture inside a thin gold inset frame, matching the uploaded image. Use only for special moments: login left panel accent, empty-state hero, PDF cover.

DO

1. Replace every "Happiness Experience" / "Happiness" / "H" monogram across the landing page, login, sidebars, page titles, loaders, footer and meta tags.
2. App loader: the key draws itself in gold strokes (stroke-dashoffset), the diamond sparkles once, then the wordmark fades in.
3. Favicon and <title>: "Velvet Keys — Absolute Control".
4. Rename the role label "Concierge" to "Conciergerie" in all UI text and nav. Keep the route names for now.

DO NOT
Change app background colors, heading/body fonts, layouts, routes or data logic. Jost is used ONLY inside the logo components.

DONE WHEN
No trace of "Happiness" remains; the logo is crisp at every size; the loader animation works.
