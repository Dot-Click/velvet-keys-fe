import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getStoredSession } from "@/components/auth-provider";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: () => {
    if (!getStoredSession()) throw redirect({ to: "/login" });
  },
  component: () => <Outlet />,
});
