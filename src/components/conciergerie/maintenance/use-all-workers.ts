import { useQuery } from "@tanstack/react-query";
import { useDataScope } from "@/hooks/use-data-scope";
import { workersService } from "@/services/ops-service";
import type { Worker } from "@/types/ops";

const MAX_PAGES = 50;

/**
 * Every worker, for pickers and the management list. The backend pages lists at a fixed size,
 * so this walks the pages. Keyed under "panel-data" so panel writes refresh it.
 */
export function useAllWorkers() {
  const scope = useDataScope();
  return useQuery({
    queryKey: ["panel-data", scope.accountId, scope.userId ?? "", scope.ownerId ?? "all", "workers-all"],
    enabled: Boolean(scope.accountId),
    queryFn: async () => {
      const workers: Worker[] = [];
      for (let page = 1; page <= MAX_PAGES; page += 1) {
        const result = await workersService.list(page);
        workers.push(...result.items);
        if (result.items.length === 0 || workers.length >= result.total) break;
      }
      return workers;
    },
  });
}
