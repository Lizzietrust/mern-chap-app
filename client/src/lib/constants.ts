export const POST_QUERY_KEYS = {
  all: ["posts"] as const,
  lists: () => [...POST_QUERY_KEYS.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...POST_QUERY_KEYS.lists(), filters] as const,
  details: () => [...POST_QUERY_KEYS.all, "detail"] as const,
  detail: (id: number) => [...POST_QUERY_KEYS.details(), id] as const,
  byUser: (userId: number) => [...POST_QUERY_KEYS.all, "user", userId] as const,
} as const;

export const DEFAULT_QUERY_CONFIG = {
  staleTime: 5 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
  retry: 3,
  retryDelay: (attemptIndex: number) =>
    Math.min(1000 * 2 ** attemptIndex, 30000),
} as const;

export const DETAIL_QUERY_CONFIG = {
  ...DEFAULT_QUERY_CONFIG,
  staleTime: 2 * 60 * 1000,
} as const;
