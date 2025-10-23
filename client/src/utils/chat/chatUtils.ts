import type { User, UserChat, ChannelChat, Chat } from "../../types/types";

export const getChatTitle = (chat: Chat, currentUser: User | null): string => {
  if (!chat) return "Select a chat";

  if (chat.type === "channel") {
    return chat.name || "Channel";
  }

  if (chat.type === "direct") {
    const otherUser = chat.participants?.find(
      (p: User) => p._id !== currentUser?._id
    );

    if (otherUser) {
      return (
        otherUser.name ||
        `${otherUser.firstName || ""} ${otherUser.lastName || ""}`.trim() ||
        otherUser.email ||
        "Unknown User"
      );
    }
    return "Unknown User";
  }

  return "Select a chat";
};

export const getDisplayUnreadCount = (
  chat: UserChat | ChannelChat,
  selectedChatId: string | undefined,
  currentUserId: string | undefined
): number => {
  if (selectedChatId === chat._id) {
    return 0;
  }

  if (typeof chat.unreadCount === "number") {
    return chat.unreadCount;
  }

  if (chat.unreadCount && typeof chat.unreadCount === "object") {
    const userCount = chat.unreadCount[currentUserId || ""];
    return typeof userCount === "number" ? userCount : 0;
  }

  return 0;
};

export const formatTime = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj?.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};
