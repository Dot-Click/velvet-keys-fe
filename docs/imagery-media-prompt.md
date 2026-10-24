# Prompt: Imagery & Media pass for the Velvet Keys landing page

Paste this whole file into your AI IDE. It covers images/media only; do not change copy, routing, auth or app logic.

## Stack and context
- React + TanStack Start, Tailwind v4, framer-motion. Landing route: `src/routes/index.tsx`; sections in `src/components/landing/`.
- Images live in `public/images/` and are shown through `src/components/landing/graded-image.tsx` (applies a CSS filter `saturate(.75) brightness(.8) contrast(1.05)`, a gold multiply tint and a bottom `#0B0B0B` gradient) and CSS `background-image` in `hero-section.tsx`, `numbers-strip-section.tsx`, `manifesto-section.tsx`, `door-unlock-section.tsx`, `image-interlude-section.tsx`, `two-horizons-section.tsx`, `property-marquee-section.tsx`.
- Current files and where they are used (measured mean luminance 0-255; target for the whole set is **below ~70**):
  | File | Size | Luma | Used in | Verdict |
  |---|---|---|---|---|
  | hero-penthouse-dusk.jpg | 1920x1306 | 148 | hero background | FAIL, bright daylight |
  | executive-interior.jpg | 1600x1067 | 159 | Two Horizons (owner) | FAIL |
  | property-harbour.jpg | 1200x796 | 160 | property cards | FAIL |
  | property-gardencourt.jpg | 1200x900 | 148 | property cards | FAIL |
  | property-aurora.jpg | 1200x800 | 140 | property cards, get-started | FAIL |
  | property-skyline.jpg | 1200x800 | 129 | property cards, Two Horizons | FAIL |
  | riad-courtyard-night.jpg | 1600x1067 | 122 | numbers strip | FAIL for a "night" image |
  | dark-marble.jpg | 1920x1013 | 115 | manifesto background | too bright for "dark marble" |
  | concierge-hub.jpg | 1600x1067 | 97 | Two Horizons (conciergerie) | borderline |
  | property-palm.jpg | 1200x1800 | 98 | property cards (portrait) | borderline |
  | property-marina.jpg | 1200x800 | 65 | property cards | OK |
  | casablanca-art-deco / riad-courtyard-dusk / tangier-terrace-night | 1376x768 | 64-68 | NOT USED YET (interlude section) | OK on tone but ~950 KB each, recompress |
  | bedroom, bathroom, villa, penthouse | 1376x768 | 25-45 | used in mockups only | OK |
  | logo.jpg | 696x623 | 76 | favicon (non-square JPEG) | replace |
- Brand palette: background `#0B0B0B`, gold `#D4AF37`, ruby `#8B002B`, text `#F8F9FA`, mint accent `#A2E8DD`.  The landing is dark-only (a light theme was tried and removed).

## Art direction (required)
1. **Dark, high-contrast studio photography with directional lighting (chiaroscuro).** One clear key light (side or low-angle), deep shadows, no flat even lighting, no bright daylight scenes. Subjects emerge from near-black.
2. **Luxury textures:** satin (draped, folded, with specular sheen), dark marble (veined, polished), metallic gold accents (brass, brushed gold, keys, hardware). Ruby (`#8B002B`) as an occasional satin or velvet accent, never dominant.
3. Moroccan-luxury cues where relevant (zellige, arches, riad courtyards, brass lanterns), shot as dark editorial still-lifes and interiors, not tourism photography.
4. Background tones must sit at or near `#0B0B0B` so the gold and ruby assets pop. No pure white, no neon, no vibrant colours.
5. No people's faces, no text, no logos or watermarks, no stock-photo look.

## Verified state of the repo (so you don't re-discover it)
- `door-unlock-section.tsx` and `image-interlude-section.tsx` exist but are **not imported anywhere** (not in `src/routes/index.tsx`), so the three new images are currently unused. Wiring them in is allowed, placing them between existing sections; do not edit copy.
- No `og:image` / `twitter:image` meta exists anywhere. Add `/images/og-image.jpg` in `src/routes/index.tsx` head (and `twitter:card` already exists).
- Favicon is `<link rel="icon" href="/logo.jpg">` in `src/routes/__root.tsx:125`, a non-square JPEG. Replace with square PNG/SVG of the key/VK monogram (16/32/48 + SVG). PWA icons already exist in `public/icons/`.
- Only `<img>` in the landing: manifesto (`alt=""`), interlude (lazy), property marquee, get-started, two-horizons, graded-image. Hero and numbers use CSS background or plain img without `width`/`height`, `decoding`, or `fetchpriority`. Hero is a CSS `background-image`, so convert it to an `<img>`/`<picture>` for LCP priority.
- No pop-ups or banners exist on the landing; keep it that way.
- Brand note: the pasted guideline mentions an arched "HAPPINESS EXPERIENCE" medallion and an "h" monogram. That belongs to a different brand. In this repo the mark is the key logo with a **VK monogram** (`src/components/brand/`). Apply the same rules to it: 50% clear space, dark backgrounds only, never alter its proportions or the wordmark typeface, use `LogoMark` for small sizes.

## Tasks
1. **Audit** every image in `public/images/` against the rules above. List which ones are too bright or flat (the hero image is currently a bright daylight interior and is the main offender).
2. **Replace or regrade** the failing images. Generate or source new ones at these sizes (JPG/WebP, quality ~80, each under 400 KB, also export an AVIF):
   - Hero: 2400x1400, dark penthouse or riad interior, single warm key light, gold highlights, dark marble floor reflections. Leave the centre-left calm for the headline.
   - Manifesto background: 2000x1200, close-up of black satin folds with a gold thread or brass key, very dark.
   - Numbers strip background: 2000x900, dark marble with gold veining.
   - Door/entry section: 1600x2000 portrait, ornate dark door or arch lit from one side, brass handle.
   - Interlude images (3): casablanca-art-deco, riad-courtyard-dusk, tangier-terrace-night, 1800x1100 each, night or dusk, pools of warm light.
   - Property cards (6): 1200x800 each, consistent grade, interiors lit by a single lamp or window, deep shadows.
   - New: `og-image.jpg` 1200x630, dark marble, gold key, ruby satin accent, centred empty space for the wordmark.
3. **Colour consistency:** give every image the same grade (cool-neutral shadows, warm gold highlights, optional faint ruby in the shadows). Remove or retune the CSS filter in `graded-image.tsx` if the new files are already graded (the `brightness(.8)` will make them too dark).
4. **Performance:** use `<picture>` with AVIF/WebP, explicit `width`/`height`, `loading="lazy"` below the fold, `fetchpriority="high"` for the hero, and `decoding="async"`. Keep Lighthouse LCP under 2.5 s.
5. **Alt text:** write short descriptive `alt` text for every informative image; decorative ones get `alt=""`. Check the locales in `src/locales` (en/fr/ar) if alt text is translated.
6. **Optional motion:** a 6-8 s looping, muted, silent hero video of drifting dust in a beam of light on dark marble (MP4 + WebM, under 2 MB, poster image, respect `prefers-reduced-motion`).

## Image-generation prompts (adapt per image)
- Hero: "Dark luxury Moroccan penthouse interior at night, single warm directional key light from the left, deep chiaroscuro shadows, polished black marble floor with soft reflections, brass and brushed gold accents, ruby red satin throw on a low sofa, cinematic, 35mm, shallow depth of field, no people, no text, background near-black #0B0B0B."
- Textures: "Macro studio photograph of black satin folds with specular highlights, one thin gold thread, dramatic side lighting, near-black background, high contrast."
- Marble: "Polished dark Nero Marquina marble with fine gold veining, raking light, extreme detail, near-black."
- Key still-life: "Antique brass key resting on ruby satin on black marble, single beam of warm light from upper left, deep shadows, luxury editorial still-life."

## Do
- Keep clear space around the primary medallion/logo equal to 50% of its diameter.
- Keep backgrounds strictly dark (`#0B0B0B` or deep charcoal).
- Use the "h"/key monogram for small breakpoints and favicons.

## Don't
- Do not place the full medallion on light or vibrant backgrounds.
- Do not alter the proportion, curvature or typeface of the arched medallion text.
- Do not add pop-ups or heavy banners; keep the quiet-luxury feel.

## Definition of done
`npm run build` passes, no layout shift, all referenced images exist, every landing image has mean luma below ~70, and hero text contrast is AA over the new hero.
