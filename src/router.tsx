import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      // The installed app is used on trains and in lifts. A screen opened without a connection
      // still loads, from its saved copy or the service layer, instead of waiting for the network.
      queries: { networkMode: "offlineFirst" },
      // Writes run (and are refused when offline, see assertOnline) rather than queueing silently
      mutations: { networkMode: "always" },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
