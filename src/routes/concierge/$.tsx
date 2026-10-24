import { createFileRoute, redirect } from "@tanstack/react-router";

const CONCIERGERIE_PAGES = ["today", "bookings", "calendar", "maintenance", "expenses"] as const;
type ConciergeriePage = (typeof CONCIERGERIE_PAGES)[number];

function isConciergeriePage(value: string): value is ConciergeriePage {
  return (CONCIERGERIE_PAGES as readonly string[]).includes(value);
}

/** Legacy /concierge/* links now live under /conciergerie/*. */
export const Route = createFileRoute("/concierge/$")({
  beforeLoad: ({ params }) => {
    const page = params._splat?.split("/")[0] ?? "";
    throw redirect({ to: `/conciergerie/${isConciergeriePage(page) ? page : "today"}` });
  },
  component: () => null,
});
