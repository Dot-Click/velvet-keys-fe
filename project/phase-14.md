Make the app an installable PWA.

1. Use vite-plugin-pwa.
2. Manifest:
   - name "Velvet Keys", short_name "Velvet Keys"
   - theme_color #0B0B0B, background_color #0B0B0B
   - display "standalone"
   - Icons generated from LogoMark (gold key on black): 192, 512 and maskable
3. Splash screen: black background with the LogoMark and the gold draw-in animation.
4. Install prompt:
   - A subtle bottom sheet on mobile, shown after the 2nd visit: "Install Velvet Keys for quick access" with Install and Not now buttons
   - iOS: show the "Share → Add to Home Screen" instructions instead
5. Offline:
   - Cache the app shell and the last-viewed data
   - When offline, show a slim top banner "You're offline — showing last saved data" and disable write actions (reuse the read-only patterns)
6. Update prompt: when a new version is available, show a toast "New version available" with a Refresh button.

BOUNDARY
PWA setup and these UI elements only.