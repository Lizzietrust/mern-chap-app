export const AUTH_KEYS = {
  ALL: ["auth"] as const,
  USER: () => [...AUTH_KEYS.ALL, "user"] as const,
} as const;

export const CACHE_KEYS = {
  CHATS: ["chats"],
  MESSAGES: ["messages"],
  USER_CHATS: ["userChats"],
  NOTIFICATIONS: ["notifications"],
  SETTINGS: ["settings"],
  SOCKET: ["socket"],
  USERS: ["users"],
} as const;

export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
} as const;

export const STALE_TIMES = {
  USER_DATA: 5 * 60 * 1000, 
} as const;
