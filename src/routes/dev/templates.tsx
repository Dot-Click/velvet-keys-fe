import { createFileRoute, notFound } from "@tanstack/react-router";
import * as React from "react";

/**
 * The preview is only imported when running in development: `import.meta.env.DEV` is replaced by a
 * constant at build time, so the production bundle neither includes it nor serves the route.
 */
const TemplatesPreview = import.meta.env.DEV
  ? React.lazy(() => import("@/templates/preview/templates-preview"))
  : null;

export const Route = createFileRoute("/dev/templates")({
  ssr: false,
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound();
  },
  head: () => ({
    meta: [{ title: "Templates (Dev Only) — Velvet Keys" }],
  }),
  component: DevTemplatesPage,
});

function DevTemplatesPage() {
  if (!TemplatesPreview) return null;
  return (
    <React.Suspense fallback={null}>
      <TemplatesPreview />
    </React.Suspense>
  );
}
