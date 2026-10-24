import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/concierge")({
  beforeLoad: () => {
    throw redirect({ to: "/conciergerie/today" });
  },
  component: () => null,
});
