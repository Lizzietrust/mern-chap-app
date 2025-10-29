import type { User, UserChat } from "../types/types";

export const formatLastMessageTime = (timestamp?: string | Date): string => {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } else if (diffInHours < 48) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  }
};

export const getDisplayName = (user: User | null | undefined): string => {
  if (!user) return "Unknown User";

  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }

  if (user.firstName) {
    return user.firstName;
  }

  if (user.name) {
    return user.name;
  }

  return "Unknown User";
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
