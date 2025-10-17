import type { User, UserChat } from "../types/types";

export const formatLastMessageTime = (
  timestamp: Date | string | undefined
): string => {
  if (!timestamp) return "";

  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);
  const diffInDays = diffInHours / 24;

  if (diffInHours < 1) {
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    return diffInMinutes < 1 ? "now" : `${diffInMinutes}m`;
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h`;
  } else if (diffInDays < 7) {
    return `${Math.floor(diffInDays)}d`;
  } else {
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  }
};

export const getDisplayName = (user: User): string => {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  if (user.firstName) {
    return user.firstName;
  }
  if (user.name) {
    return user.name;
  }
  return user.email || "Unknown User";
};

export const getSenderDisplayName = (
  sender: User | string | undefined
): string => {
  if (!sender) return "Unknown User";

  if (typeof sender === "string") {
    return "User";
  }

  if (sender.firstName && sender.lastName) {
    return `${sender.firstName} ${sender.lastName}`;
  }
  if (sender.firstName) {
    return sender.firstName;
  }
  if (sender.name) {
    return sender.name;
  }
  if (sender.email) {
    return sender.email;
  }

  return "Unknown User";
};

export const getOtherParticipant = (chat: UserChat, currentUserId?: string) => {
  return chat.participants?.find((p) => p._id !== currentUserId);
};
