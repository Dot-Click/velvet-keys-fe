Update the existing Conciergerie operations screens for channel sync and long-term rentals.

1. CHANNEL CONNECTIONS (new: /conciergerie/channels)
- Header: "Connect Airbnb & Booking.com". Short explainer, styled as Velvet Keys — never show the Channex brand (white-label).
- Table of all STR units with: Airbnb status, Booking.com status (Connected / Not connected / Error), last sync time, and a "Connect" button.
- Connect flow (mock): a modal with steps
  1. Choose platform
  2. "Log in with Airbnb / Booking.com" button, simulated success
  3. Pick a listing from a mock list to map to this unit
  4. Success state with a pulsing jade "Live sync" dot
- Error state row: ruby, with a "Reconnect" action.
- Free sync badge on eligible units: "Free sync until [date]". Billing note: "+20 MAD / unit / month after free period".

2. BOOKINGS (update the existing screen)
- The list shows a "Synced" badge with a small sync icon on bookings from Airbnb / Booking.com. Synced bookings are read-only except for internal notes.
- The manual intake form is now labelled "Add direct booking". The source is fixed to Direct, and the unit picker only shows STR units.

3. CALENDAR (update the existing timeline)
- LTR units appear as rows too, with the lease drawn as one long jade-outlined bar spanning the lease dates, labelled with the tenant name. Clicking it opens the lease drawer.
- Filter chips: All / STR / LTR.
- Synced bookings show their platform mark inside the bar.

4. TODAY (update)
- Add a "Rent due" block: LTR rents due today and in the next 7 days, plus late rents (ruby), each with a one-tap "Mark received" action.
- Add a "Sync issues" alert when any channel connection is in an error state.

All actions respect read-only mode.

BOUNDARY
Only Channels (new), Bookings, Calendar and Today in the Conciergerie panel.