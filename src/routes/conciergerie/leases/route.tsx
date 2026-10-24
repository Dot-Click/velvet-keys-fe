import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/conciergerie/leases")({
  component: Outlet,
});
