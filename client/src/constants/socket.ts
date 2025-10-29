export const SOCKET_EVENTS = {
  CONNECT: "connect",
  CONNECT_ERROR: "connect_error",
  DISCONNECT: "disconnect",
  ERROR: "error",
  ONLINE_USERS: "onlineUsers",
  USER_ONLINE: "userOnline",
  USER_OFFLINE: "userOffline",
  NEW_MESSAGE: "newMessage",
  CHAT_UPDATED: "chatUpdated",
  SEND_MESSAGE: "sendMessage",
  JOIN_CHAT: "joinChat",
  LEAVE_CHAT: "leaveChat",
  UPDATE_USER_STATUS: "updateUserStatus",
  MESSAGE_STATUS_UPDATE: "messageStatusUpdate",
  GET_ONLINE_USERS: "getOnlineUsers",
  MARK_AS_DELIVERED: "markAsDelivered",
  MESSAGE_DELIVERED: "messageDelivered",
  MESSAGE_READ: "messageRead",
  MARK_MESSAGES_AS_READ: "markMessagesAsRead",
  MARK_ALL_MESSAGES_AS_READ: "markAllMessagesAsRead",
} as const;

export const SOCKET_CONFIG = {
  transports: ["websocket", "polling"],
  withCredentials: true,
};
