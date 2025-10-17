import { useSocket } from "../contexts/useSocket";
import type { Chat, User } from "../types/types";

export const useChatSubtitle = () => {
  const { onlineUsers } = useSocket();

  const getChatSubtitle = (
    selectedChat: Chat | null,
    currentUser: User | null
  ): string => {
    if (!selectedChat) return "";

    if (selectedChat.type === "channel") {
      return `${selectedChat.members?.length || 0} members • ${
        selectedChat.isPrivate ? "Private" : "Public"
      }`;
    }

    if (selectedChat.type === "direct") {
      const otherUser = selectedChat.participants.find(
        (p) => p._id !== currentUser?._id
      );

      if (otherUser) {
        // Check if user is in onlineUsers
        const isUserOnline = onlineUsers.some((u) => u._id === otherUser._id);

        console.log("🔍 Checking user status:", {
          otherUserId: otherUser._id,
          isUserOnline,
          onlineUsers: onlineUsers.map((u) => u._id),
          otherUserData: otherUser,
        });

        if (isUserOnline) return "Online";
        if (otherUser.lastSeen)
          return `Last seen ${formatTime(otherUser.lastSeen)}`;
        return "Offline";
      }
    }

    return "";
  };

  return { getChatSubtitle };
};

const formatTime = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};
