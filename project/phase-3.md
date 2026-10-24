Expand authentication and routing to 4 roles: Admin, Conciergerie, Owner, Tenant. Keep everything mocked.

ROUTES
/admin/*, /conciergerie/* (rename from /concierge/*), /owner/*, /tenant/*
Keep the existing guards and add guards for the two new trees. Placeholder home pages for /admin and /tenant are enough for now.

AUTH PAGES (same split-screen luxury style as the current login)
1. Login: add a "Forgot password?" link and a link to Sign up.
2. Sign up (open to Owner and Conciergerie):
   - Step 1, choose account type: two large selectable cards — "I own properties" (Owner) / "I manage properties for owners" (Conciergerie), each with a short description and a line-art illustration.
   - Step 2: full name, company name (Conciergerie only), email, phone, password with strength meter, preferred language, terms checkbox.
   - Step 3: success screen, then into the panel.
3. Forgot password: email form, then a "check your inbox" state.
4. Reset password: new password + confirm.
5. Accept invitation (/invite/:token) for an invited Owner, Conciergerie or Tenant:
   - Shows who invited them and for which property/unit
   - Set password + language, then go to their panel

ROLE LOGIC
- Mock accounts:
  - admin@velvetkeys.demo
  - conciergerie@velvetkeys.demo (manages 3 owners)
  - owner@velvetkeys.demo (invited by the conciergerie)
  - solo@velvetkeys.demo (owner with no conciergerie)
  - tenant@velvetkeys.demo
- Solo Owner: the Owner panel nav gets an extra "Operations" section containing all Conciergerie tools.
- Read-only mode infrastructure:
  - Add an accountStatus field: "active" | "readonly" | "banned"
  - Build a useReadOnly() hook
  - Build a <ReadOnlyGuard> wrapper that disables add/edit/delete buttons, shows a tooltip "Account is read-only until the invoice is paid", and shows a persistent ruby top banner: "Your account is read-only. Invoice #… is overdue." with a "View invoice" button.
  - Banned accounts are blocked at login with a message.
- The dev-only role switcher stays hidden behind import.meta.env.DEV and now lists all 5 mock accounts.

DO NOT
Build any module content inside the panels in this phase.

DONE WHEN
Each mock account lands in the right panel; signup, forgot/reset and invite flows work with mock data; the read-only banner and disabled buttons appear when accountStatus is "readonly".