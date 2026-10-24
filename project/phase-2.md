Add full internationalization: EN (default), FR, AR. Arabic is right-to-left.

BUILD
1. Set up i18next + react-i18next with translation files in src/locales/{en,fr,ar}/*.json, organised by namespace (common, auth, owner, conciergerie, tenant, admin, billing, landing).
2. Move EVERY existing hard-coded UI string into translation keys. Provide FR and AR machine translations.
3. Language switcher component (EN / FR / AR):
   - Placed in the top bar of every panel, the landing nav and the login page
   - Saves the choice to localStorage and to the mock user profile
   - First visit defaults to EN
4. RTL:
   - When AR is active, set <html dir="rtl" lang="ar">
   - Convert all layout CSS to logical properties
   - Mirror the sidebar to the right, flip directional icons (arrows, chevrons)
   - Charts and calendars still read naturally
5. Arabic typography: add "Noto Naskh Arabic" (serif-feel, for headings) and "IBM Plex Sans Arabic" (UI/body) via Google Fonts. Apply them only when lang="ar", at the same type scale.
6. Locale formatting:
   - Update formatMAD() and the date/number formatters to use the active locale (fr-MA, ar-MA, en-GB)
   - Keep "MAD" as the currency label in all languages
7. Smooth language switching: fade the content (200ms) and keep the user on the same page.

DO NOT
Change layouts, features or roles beyond what RTL mirroring needs.

DONE WHEN
Switching to AR mirrors every existing screen correctly; no English remains in FR/AR mode; no hard-coded strings remain.