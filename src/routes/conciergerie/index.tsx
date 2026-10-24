import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/conciergerie/")({
  ssr: false,
  beforeLoad: () => {
    throw redirect({ to: "/conciergerie/today" });
  },
  component: () => null,
});
