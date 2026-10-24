Create the typed data model and mock services that every later phase will use, then refactor the existing screens to use them. Do NOT build any new screens.

TYPES (src/types)
- Account: id, type (owner | conciergerie), holderUserId, status, signupDate, language, launchOffer {type, strFreeUntil, ltrFreeUntil, bundleCompletedAt, manualOffer?}, freeSyncUntil
- User: id, accountId, role, name, email, phone, language, invitedBy
- Property: id, accountId, ownerId, name, address, city, image, commissionPct, status (active | delisted)
- Unit: id, propertyId, name, type (STR | LTR), bedrooms, image, channelConnection?, typeHistory[]
- ChannelConnection: unitId, airbnb {status, listingName}, bookingCom {status, listingName}, lastSyncAt
- Booking (STR): id, unitId, source (airbnb | booking | direct), synced (boolean), guestName, guestContact, checkIn, checkOut, amountMAD, depositStatus, paymentStatus
- Tenant: id, userId, name, email, phone
- Lease (LTR): id, unitId, tenantId, startDate, endDate, monthlyRentMAD, depositMAD, contractFileUrl, status (active | ending | ended)
- RentInvoice: id, leaseId, period, amountMAD, issuerProfile snapshot, status (unpaid | paid | late), dueDate
- IssuerProfile: name, address, ice?, rib
- MaintenanceTicket, Expense (category: workerPay | utility | other), Worker
- SubscriptionInvoice: id, accountId, period, lines[] {type: str | ltr | sync | offer, units, unitPrice, days, total, label}, subtotal, vat, total, status (draft | sent | paid | overdue), proForma (boolean), dueDate, paidAt
- PlatformSettings: prices {str: 200, ltr: 100, sync: 20}, launchDeadline, freeSyncSlots {total: 200, used}, companyLegal {name, address, ice, if, rc, patente, rib}

MOCK DATA (src/mocks), realistic Moroccan data
- Cities: Casablanca, Marrakech, Rabat, Tangier
- 1 conciergerie with 3 owners and 8 properties / 22 units (mix of STR and LTR)
- 1 solo owner with 2 properties
- 12 months of bookings, 6 leases with rent schedules, expenses, maintenance tickets, subscription invoices (including one overdue), and 4 Admin-visible client accounts

SERVICES (src/services)
CRUD-style functions per entity that return Promises with ~400ms simulated latency. Writes update an in-memory store so changes persist during the session.

UTILITIES (src/lib)
- calcNetProfit()
- calcCommission()
- calcOccupancy()
- estimateNextInvoice(account): applies prices, day proration, free months and free sync, and returns invoice lines

REFACTOR
Point all existing Owner and Conciergerie screens to these services. Keep their UI exactly the same.

DONE WHEN
Every existing screen reads from the services; there is no inline mock data left in components; the utilities return correct numbers for the mock data.