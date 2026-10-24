PROJECT CONTEXT — read fully. Do NOT change any code in this message. Reply only with (1) a short summary of your understanding and (2) a list of existing files/routes that future changes will touch.

PRODUCT
Velvet Keys, tagline "Absolute Control" (previously named "Happiness Experience" — this rename happens in a later prompt). A rental-management SaaS for Morocco covering short-term rentals (STR: Airbnb / Booking.com / direct stays) and long-term rentals (LTR: leases with monthly rent). Web app + PWA. Multi-property, multi-unit. Currency MAD; prices exclude VAT; VAT 20% added on invoices. Languages: EN (default), FR, AR (Arabic = RTL).

ROLES (4)

1. Admin: the platform owner (Velvet Keys staff). Manages clients, pricing, invoices, moderation.
2. Conciergerie: property manager. Runs daily operations for many owners' properties.
3. Owner: property owner. Mostly read-only financial overview of their own properties.
4. Tenant: LTR tenant. Very basic access to their lease and rent invoices.

ACCOUNT RULES

- Open signup for Owner and Conciergerie. Tenants are invite-only.
- The account holder pays the subscription for all units in their account.
- A Conciergerie invites Owners; each Owner sees only their own properties.
- An Owner can invite a Conciergerie.
- A solo Owner (no conciergerie) gets all Conciergerie tools in addition to the Owner views.
- Admin can ban/unban users and delist properties.

DATA BASICS

- Property → Units. Each unit is STR or LTR. A unit can switch type, but the switch is blocked while it has future bookings or an active lease.
- STR units can be connected to Airbnb / Booking.com through Channex (white-label channel manager). Synced bookings arrive automatically with guest, dates and price. Direct bookings are entered manually.
- LTR units have leases: tenant, dates, monthly rent, deposit, contract file, rent schedule.
- Conciergerie commission: a % per property (default 20%), set by the Conciergerie, calculated on STR booking revenue and LTR rent. Owners see it read-only. It is deducted in the Owner's net profit.
- Net profit = gross revenue (STR + LTR) − commission − payroll − utilities − repairs.

SUBSCRIPTION BILLING (Velvet Keys charges its clients)

- Prices (Admin-editable): STR 200 MAD/unit/month, LTR 100 MAD/unit/month, channel sync +20 MAD per synced STR unit/month.
- Prorated by days when units are added, removed or switched.
- Launch offer for signups before 31 Jan 2027 23:59 (Casablanca time):
  - STR only: 2 free STR months
  - LTR only: 2 free LTR months
  - STR + LTR: 2 + 2
  - STR + sync + LTR: 2 STR + 3 LTR
- Free sync: the first 200 synced units platform-wide get 2 months free sync, counted from the client's signup.
- Invoice lines: STR units × price, LTR units × price, synced units × 20, subtotal, VAT 20%, total. Free months show as 0 MAD lines labelled "Launch offer – free month X of Y".
- Payment: bank transfer only (RIB shown on invoice).
  - Due in 7 days. Reminder email on day 5. On day 8 the account goes READ-ONLY (can log in and view, cannot add or edit).
  - Admin marks the invoice paid manually, which restores full access.
  - Only the account holder's team goes read-only; their Owners and Tenants keep view access.
- Until Admin fills in company legal details (ICE, IF, RC, Patente, RIB), invoices are labelled "Pro-forma".

RENT INVOICES (Conciergerie or solo Owner → Tenant)

- Issued under the manager's own "Invoice issuer" profile: name, address, optional ICE, RIB.
- Rent is paid by bank transfer directly to that RIB.

OUT OF SCOPE (never build): marketplace, laundry, insurance, car fleet, partner referrals, tier pricing, card payments, PayPal, native app, guest portal, tenant chat or repair requests.

FRONTEND RULES — apply to EVERY future prompt

- Frontend only. No real backend.
  - Typed models live in src/types.
  - Mock data lives in src/mocks.
  - Services live in src/services and return Promises with ~400ms simulated latency, so a real API can replace them later without UI changes.
- Never hard-code UI text. Every string goes through i18n keys (EN/FR/AR).
- Money via formatMAD(); dates and numbers via the locale formatter.
- Use logical CSS properties (margin-inline-start, padding-inline-end, start/end instead of left/right) so Arabic RTL works.
- Reuse the existing design system, tokens, motion and components. Never add new colors or fonts unless a prompt says so.
- Each role has its own route tree, its own nav config and route guards.
- Every screen needs designed empty, loading (skeleton) and error states.
- Fully responsive. Conciergerie and Tenant screens are mobile-first.
- One prompt = one phase. Never modify areas outside a prompt's stated boundary.
