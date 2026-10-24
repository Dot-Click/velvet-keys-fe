Add 3 new screens to the Conciergerie panel (/conciergerie) and add them to its nav. Use the existing design system and the Phase 4 services.

1. PROPERTIES & UNITS (/conciergerie/properties)
- A gallery of property cards: image, name, city, owner name, unit count split into STR / LTR chips, commission %.
- Property detail page:
  - Hero image and an info block (address, owner, commission %)
  - Units table: name, type badge (STR gold / LTR jade), bedrooms, status, channel sync status
  - Actions: add unit, edit unit
- "Add property" drawer: name, address, city, owner (select from invited owners), image upload with preview, commission % (default 20).
- "Add / edit unit" drawer: name, type (STR / LTR segmented control), bedrooms, image.
- Switch unit type: a "Switch to LTR / STR" action.
  - If the unit has future bookings or an active lease, the action is disabled with a tooltip explaining why.
  - Otherwise, a confirm modal explains: new monthly price from the next day (prorated); STR → LTR disconnects channel sync.
  - Show the type history on the unit detail page.

2. OWNERS (/conciergerie/owners)
- List of owners: avatar, name, email, property count, invite status (pending / active).
- "Invite owner" drawer: name, email, language, assign properties (multi-select). Shows a mock "invitation sent" toast.
- Owner detail: their properties, and a "Resend invite" action.

3. COMMISSION (inside the property detail page + a summary page at /conciergerie/commission)
- Summary page: table of all properties with commission % (inline editable), this month's commission earned in MAD, and the total.
- Editing a % shows a note: "Applies from the next booking / rent period. Past figures stay unchanged."
- Default % for new properties: editable at the top of the page (default 20%).

All add/edit actions respect read-only mode (useReadOnly).

BOUNDARY
Only these Conciergerie screens and their nav entries. Do not touch the Owner, Admin or Tenant panels, or other Conciergerie screens.