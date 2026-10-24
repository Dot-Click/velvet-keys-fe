import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/design-system")({
  ssr: false,
  beforeLoad: () => {
    throw redirect({ to: "/dev/design-system" });
  },
  component: () => null,
});
