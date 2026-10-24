import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { MotionConfig } from "framer-motion";
import { useEffect, type ReactNode } from "react";
import "@/lib/i18n";
import { useTranslation } from "react-i18next";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/auth-provider";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { PwaLifecycle } from "@/components/pwa/pwa-lifecycle";
import { PwaSplash } from "@/components/pwa/pwa-splash";
import { QueryCachePersistence } from "@/components/pwa/query-cache-persistence";
import { SPLASH_ATTRIBUTE } from "@/lib/pwa";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

import { ArchitecturalArch404 } from "@/components/illustrations/architectural-illustrations";
import { Button } from "@/components/ui/button";

function NotFoundComponent() {
  const { t } = useTranslation("common");
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B0B0B] text-foreground luxury-canvas px-4 py-16 text-center">
      <div className="relative max-w-md space-y-6">
        <ArchitecturalArch404 className="size-36 opacity-60" />
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.25em] text-primary font-medium">
            {t("notFound.eyebrow")}
          </p>
          <h1 className="font-display text-2xl uppercase tracking-[0.15em] text-foreground sm:text-3xl">
            {t("notFound.title")}
          </h1>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
            {t("notFound.body")}
          </p>
        </div>
        <div className="pt-2">
          <Button asChild size="lg" className="text-xs uppercase tracking-[0.14em]">
            <Link to="/">{t("notFound.cta")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const { t } = useTranslation("common");
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {t("errorPage.title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("errorPage.body")}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("errorPage.retry")}
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {t("errorPage.home")}
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Velvet Keys — Absolute Control" },
      {
        name: "description",
        content:
          "Velvet Keys — Absolute Control. Rental-management SaaS for Morocco covering short-term and long-term rentals.",
      },
      { name: "author", content: "Velvet Keys" },
      { property: "og:title", content: "Velvet Keys — Absolute Control" },
      {
        property: "og:description",
        content:
          "Velvet Keys — Absolute Control. Rental-management SaaS for Morocco covering short-term and long-term rentals.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@VelvetKeys" },
      // Installable app: address-bar colour, and the home-screen behaviour on iPhone and iPad
      { name: "theme-color", content: "#0B0B0B" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "Velvet Keys" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { rel: "icon", href: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { rel: "icon", href: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { rel: "apple-touch-icon", href: "/icons/apple-touch-icon.png" },
      // The manifest is written by the production build only (vite-plugin-pwa)
      ...(import.meta.env.PROD ? [{ rel: "manifest", href: "/manifest.webmanifest" }] : []),
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&family=Jost:wght@300;400&family=Montserrat:wght@400;500;600&family=Noto+Naskh+Arabic:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    // The script below sets lang, dir and the splash attribute before React loads
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var lang = localStorage.getItem('i18n_lang') || 'en';
                document.documentElement.lang = lang;
                document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
              } catch(e) {}
              try {
                // Opened from the home screen and not yet shown this session: the splash screen is due
                var standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
                if (standalone && !sessionStorage.getItem('vk_loader_shown')) {
                  document.documentElement.setAttribute('${SPLASH_ATTRIBUTE}', '');
                }
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { i18n } = useTranslation();

  useEffect(() => {
    const lang = i18n.language || "en";
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Framer Motion animations follow the system "reduce motion" setting, like the CSS ones */}
      <MotionConfig reducedMotion="user">
        <AuthProvider>
          <div id="app-content-root" className="lang-fade-transition min-h-screen">
            {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
            <Outlet />
          </div>
          <Toaster position={i18n.dir() === "rtl" ? "top-left" : "top-right"} dir={i18n.dir()} />
          <PwaSplash />
          <InstallPrompt />
          <PwaLifecycle />
          <QueryCachePersistence />
        </AuthProvider>
      </MotionConfig>
    </QueryClientProvider>
  );
}
