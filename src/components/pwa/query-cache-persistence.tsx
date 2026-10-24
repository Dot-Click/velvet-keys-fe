import { useEffect } from "react";
import { dehydrate, hydrate, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-provider";

const STORAGE_KEY = "velvet-keys.pwa.query-cache";
/** Saved data older than this is not shown again. */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
/** A copy this large would risk the browser's storage quota, so it is not saved. */
const MAX_CHARS = 2_000_000;
const SAVE_DELAY_MS = 1500;
/** Every panel query lives under this key (see use-portfolio-data.ts). */
const PANEL_ROOT = "panel-data";

interface SavedCache {
  userId: string;
  accountId: string;
  role: string;
  savedAt: number;
  state: ReturnType<typeof dehydrate>;
}

function forget() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage is not available
  }
}

function restore(queryClient: QueryClient, userId: string, accountId: string, role: string) {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw) as SavedCache;
    // Someone else's data, or too old: drop it rather than show it
    if (
      saved.userId !== userId ||
      saved.accountId !== accountId ||
      saved.role !== role ||
      Date.now() - saved.savedAt > MAX_AGE_MS) return forget();
    // Anything fetched since is newer and is kept
    hydrate(queryClient, saved.state);
  } catch {
    forget();
  }
}

function save(queryClient: QueryClient, userId: string, accountId: string, role: string) {
  try {
    const state = dehydrate(queryClient, {
      shouldDehydrateQuery: (query) =>
        query.state.status === "success" && query.queryKey[0] === PANEL_ROOT,
    });
    const payload = JSON.stringify({ userId, accountId, role, savedAt: Date.now(), state } satisfies SavedCache);
    if (payload.length <= MAX_CHARS) window.localStorage.setItem(STORAGE_KEY, payload);
  } catch {
    // Full or unavailable storage: the last copy stays
  }
}

/**
 * Keeps a copy of the panel data the signed-in person has viewed, so the screens they opened last
 * show something on a train or in a lift, and are refreshed as soon as there is a connection.
 * The copy belongs to one person: signing out, or someone else signing in, clears it.
 */
export function QueryCachePersistence() {
  const queryClient = useQueryClient();
  const { session, isReady } = useAuth();
  const userId = session?.profile.id ?? null;
  const accountId = session?.profile.accountId ?? "";
  const role = session?.profile.role ?? "";

  useEffect(() => {
    if (!isReady) return;
    if (!userId) return forget();

    restore(queryClient, userId, accountId, role);

    let timer: number | undefined;
    const unsubscribe = queryClient.getQueryCache().subscribe(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => save(queryClient, userId, accountId, role), SAVE_DELAY_MS);
    });
    // Leaving the page must not lose what was fetched in the last moment
    const flush = () => save(queryClient, userId, accountId, role);
    window.addEventListener("pagehide", flush);

    return () => {
      window.clearTimeout(timer);
      unsubscribe();
      window.removeEventListener("pagehide", flush);
    };
  }, [isReady, queryClient, userId, accountId, role]);

  return null;
}
