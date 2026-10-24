import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/owner/")({
  ssr: false,
  beforeLoad: () => {
    throw redirect({ to: "/owner/overview" });
  },
  component: () => null,
});
