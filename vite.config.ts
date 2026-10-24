// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

// Files from public/ are copied into the build by Nitro, after the client build has finished, so the
// plugin cannot find them when it lists the build. These are the ones the worker must have offline.
const publicDir = resolve(process.cwd(), "public");
const precachedPublicFiles = [
  "offline.html",
  ...readdirSync(resolve(publicDir, "icons")).map((name) => `icons/${name}`),
].map((url) => ({
  url,
  revision: createHash("md5")
    .update(readFileSync(resolve(publicDir, url)))
    .digest("hex"),
}));

// A TanStack Start build runs the plugin's hooks once per environment (client, server, nitro). The
// worker has to be written once, during the client build, before Nitro lists the public folder:
// written again afterwards, its size no longer matches what Nitro recorded.
const pwaPlugins = VitePWA({
  // The app is server-rendered, so there is no index.html to carry the manifest link or the
  // registration script: both are added by hand (src/routes/__root.tsx, src/components/pwa).
  injectRegister: false,
  // New versions wait for a tap on "Refresh" in the update toast
  registerType: "prompt",
  // Our own worker (src/sw.ts) so that pages, fonts and photos can be cached the way the app needs
  strategies: "injectManifest",
  srcDir: "src",
  filename: "sw.ts",
  // The icons are precached with the other public files (see precachedPublicFiles)
  includeManifestIcons: false,
  manifest: {
    id: "/",
    name: "Velvet Keys",
    short_name: "Velvet Keys",
    description: "Rental management for Morocco: short-term and long-term rentals.",
    // The installed app opens at sign-in, which sends a signed-in person on to their panel
    start_url: "/login",
    scope: "/",
    display: "standalone",
    theme_color: "#0B0B0B",
    background_color: "#0B0B0B",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  },
  integration: {
    // A TanStack Start build puts the browser files in the client environment's own folder
    // (.output/public, or dist/client on Lovable), not in build.outDir. Pointing the plugin
    // there makes it precache the real files and write sw.js and the manifest beside them.
    configureOptions(config, options) {
      const clientDir = config.environments["client"]?.build.outDir;
      if (clientDir) options.outDir = clientDir;
    },
  },
  injectManifest: {
    // A classic script, so every browser that has service workers can run it
    rollupFormat: "iife",
    // Scripts, styles and the small static files; photos are saved as they are seen
    globPatterns: ["**/*.{js,css,html,png,svg,ico,webmanifest}"],
    globIgnores: ["images/**", "email/**"],
    additionalManifestEntries: precachedPublicFiles,
    maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
  },
}).map((plugin) => ({
  ...plugin,
  applyToEnvironment: (environment: { name: string }) => environment.name === "client",
}));

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  plugins: pwaPlugins,
});
