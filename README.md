# Ebon Grace System

Build the global design system and navigation shell for "Velvet Keys" (tagline: "Absolute Control"), a premium rental-management platform for Morocco. Visual direction: quiet luxury, restrained, dark-mode only.

DESIGN TOKENS

- Background: Ebon Black #0B0B0B (page canvas)
- Surface/card: Deep Charcoal #141414
- Primary accent: Chiseled Gold #D4AF37 (CTAs, active nav state, revenue figures)
- Secondary/critical accent: Imperial Ruby #8B002B (critical alerts, expense warnings)
- Status accent: Jade Mint #A2E8DD (confirmed bookings, high occupancy)
- Primary text on dark: Diamond White #F8F9FA
- Headings (H1–H3): Cinzel or Cormorant Garamond, all-caps, letter-spacing 0.15em
- Body/UI text: Inter or Montserrat, weight 400–500, line-height 1.6

LAYOUT RULES

- Ultra-wide grid, heavy negative space, minimum 120px vertical section padding on desktop
- Card surfaces on Deep Charcoal, subtle 1px gold-tinted border, soft shadow, 8–12px radius
- Hover: soft gold glow or subtle 3D parallax tilt on interactive cards
- Transitions: 0.4s ease, cubic-bezier(0.25, 1, 0.5, 1) on all interactive states
- Scroll-triggered fade-in for section reveals

BUILD

1. Left sidebar nav (collapses to bottom nav on mobile) with a role badge (Owner / Concierge) and logo mark placeholder.
2. Top bar with a property/unit switcher dropdown (multi-property support is required) and a user avatar menu.
3. Base component library: buttons (primary gold, secondary ghost, destructive ruby), inputs, dropdown/select, modal/dialog shell, toast notification, status badge/pill (confirmed, pending, critical), empty state pattern, loading skeleton pattern.
4. One placeholder screen using only these components (dummy content) to prove the system out.

Keep it dark, restrained, premium — no bright/neon colors, no heavy drop-shadows, no default Lovable/Tailwind blue anywhere.
