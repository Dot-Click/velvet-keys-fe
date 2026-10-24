import type { UseQueryResult } from "@tanstack/react-query";

type QueryLike<T> = Pick<UseQueryResult<T>, "data" | "isPending" | "isError" | "refetch">;

/** Treats several queries as one for QueryView: ready when all are, failed when any fails. */
export function combineQueries<T extends unknown[]>(
  ...queries: { [K in keyof T]: QueryLike<T[K]> }
): QueryLike<T> {
  const ready = queries.every((query) => query.data !== undefined);
  return {
    data: ready ? (queries.map((query) => query.data) as T) : undefined,
    isPending: queries.some((query) => query.isPending),
    isError: queries.some((query) => query.isError),
    refetch: (async () => {
      await Promise.all(queries.map((query) => query.refetch()));
    }) as unknown as UseQueryResult<T>["refetch"],
  } as QueryLike<T>;
}
