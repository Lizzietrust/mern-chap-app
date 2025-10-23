import type { ChatSubtitleConfig } from "../types/chat";

export const CHAT_KEYS = {
  all: ["chats"] as const,
  lists: () => [...CHAT_KEYS.all, "list"] as const,
  list: (filters?: string) => [...CHAT_KEYS.lists(), { filters }] as const,
  details: () => [...CHAT_KEYS.all, "detail"] as const,
  detail: (id: string) => [...CHAT_KEYS.details(), id] as const,
  userChats: (userId?: string) => [...CHAT_KEYS.all, "user", userId] as const,
} as const;

export const MESSAGE_KEYS = {
  all: ["messages"] as const,
  lists: () => [...MESSAGE_KEYS.all, "list"] as const,
  list: (chatId: string) => [...MESSAGE_KEYS.lists(), chatId] as const,
  details: () => [...MESSAGE_KEYS.all, "detail"] as const,
  detail: (id: string) => [...MESSAGE_KEYS.details(), id] as const,
  status: (messageId: string) =>
    [...MESSAGE_KEYS.all, "status", messageId] as const,
} as const;

export const DEFAULT_QUERY_OPTIONS = {
  refetchOnMount: true,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  staleTime: 0,
  gcTime: 5 * 60 * 1000,
  retry: 3,
  retryDelay: (attemptIndex: number) =>
    Math.min(1000 * 2 ** attemptIndex, 30000),
} as const;

export const MESSAGES_QUERY_OPTIONS = {
  staleTime: 10000,
  refetchOnWindowFocus: false,
  refetchOnMount: true,
  gcTime: 5 * 60 * 1000,
} as const;

export const DEFAULT_SUBTITLE_CONFIG: ChatSubtitleConfig = {
  showMemberCount: true,
  showPrivacyStatus: true,
  showLastSeen: true,
  timeFormat: "12h",
} as const;

export const STATUS_TEXTS = {
  ONLINE: "Online",
  OFFLINE: "Offline",
  TYPING: "Typing...",
} as const;