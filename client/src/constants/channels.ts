export const CHANNEL_KEYS = {
  all: ["channels"] as const,
  lists: () => [...CHANNEL_KEYS.all, "list"] as const,
  list: (filters?: string) => [...CHANNEL_KEYS.lists(), { filters }] as const,
  details: () => [...CHANNEL_KEYS.all, "detail"] as const,
  detail: (id: string) => [...CHANNEL_KEYS.details(), id] as const,
  members: (channelId: string) => ["channel-members", channelId] as const,
} as const;

export const DEFAULT_QUERY_OPTIONS = {
  refetchOnMount: true,
  refetchOnWindowFocus: true,
  staleTime: 0,
  gcTime: 5 * 60 * 1000,
} as const;
