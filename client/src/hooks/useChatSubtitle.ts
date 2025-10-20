import { useCallback, useMemo } from "react";
import { useSocket } from "./useSocket";
import type { Chat, ChannelChat, UserChat } from "../types/types";
import type { User } from "../types/app";
import type { ChatSubtitleConfig, UserStatus } from "../types/chat";
import { DEFAULT_SUBTITLE_CONFIG, STATUS_TEXTS } from "../constants/chat";

const isChannelChat = (chat: Chat): chat is ChannelChat => {
  return chat.type === "channel";
};

const isUserChat = (chat: Chat): chat is UserChat => {
  return chat.type === "direct";
};

const formatTime = (
  date: Date | string,
  timeFormat: "12h" | "24h" = "12h"
): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: timeFormat === "12h",
  });
};

const getUserStatus = (
  user: User,
  onlineUsers: User[],
  config: ChatSubtitleConfig
): UserStatus => {
  const isOnline = onlineUsers.some(
    (onlineUser) => onlineUser._id === user._id
  );

  if (isOnline) {
    return {
      isOnline: true,
      statusText: STATUS_TEXTS.ONLINE,
    };
  }

  if (user.lastSeen && config.showLastSeen) {
    const lastSeenText = `Last seen ${formatTime(
      user.lastSeen,
      config.timeFormat
    )}`;
    return {
      isOnline: false,
      lastSeen:
        typeof user.lastSeen === "string"
          ? new Date(user.lastSeen)
          : user.lastSeen,
      statusText: lastSeenText,
    };
  }

  return {
    isOnline: false,
    statusText: STATUS_TEXTS.OFFLINE,
  };
};

const getChannelSubtitle = (
  chat: ChannelChat,
  config: ChatSubtitleConfig
): string => {
  const parts: string[] = [];

  if (config.showMemberCount) {
    const memberCount = chat.members?.length || 0;
    parts.push(`${memberCount} ${memberCount === 1 ? "member" : "members"}`);
  }

  if (config.showPrivacyStatus) {
    parts.push(chat.isPrivate ? "Private" : "Public");
  }

  return parts.join(" • ");
};

const getDirectChatSubtitle = (
  chat: UserChat,
  currentUser: User | null,
  onlineUsers: User[],
  config: ChatSubtitleConfig
): string => {
  const otherUser = chat.participants?.find((p) => p._id !== currentUser?._id);

  if (!otherUser) {
    return "Unknown User";
  }

  const userStatus = getUserStatus(otherUser, onlineUsers, config);
  return userStatus.statusText;
};

export const useChatSubtitle = (userConfig?: Partial<ChatSubtitleConfig>) => {
  const { onlineUsers } = useSocket();

  const config = useMemo(
    () => ({
      ...DEFAULT_SUBTITLE_CONFIG,
      ...userConfig,
    }),
    [userConfig]
  );

  const getChatSubtitle = useCallback(
    (selectedChat: Chat | null, currentUser: User | null): string => {
      if (!selectedChat) {
        return "";
      }

      try {
        if (isChannelChat(selectedChat)) {
          return getChannelSubtitle(selectedChat, config);
        }

        if (isUserChat(selectedChat)) {
          return getDirectChatSubtitle(
            selectedChat,
            currentUser,
            onlineUsers,
            config
          );
        }

        console.warn("Unknown chat type:", selectedChat);
        return "";
      } catch (error) {
        console.error("Error generating chat subtitle:", error);
        return "";
      }
    },
    [onlineUsers, config]
  );

  const chatSubtitle = useCallback(
    (selectedChat: Chat | null, currentUser: User | null): string => {
      return getChatSubtitle(selectedChat, currentUser);
    },
    [getChatSubtitle]
  );

  const getUserChatStatus = useCallback(
    (user: User): UserStatus => {
      return getUserStatus(user, onlineUsers, config);
    },
    [onlineUsers, config]
  );

  const isUserOnline = useCallback(
    (userId: string): boolean => {
      return onlineUsers.some((user) => user._id === userId);
    },
    [onlineUsers]
  );

  return {
    chatSubtitle,
    getChatSubtitle,
    getUserChatStatus,
    isUserOnline,
    onlineUsers,
    isChannelChat,
    isUserChat,
  };
};
