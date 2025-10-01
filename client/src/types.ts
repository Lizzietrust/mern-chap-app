import type { Dispatch, SetStateAction } from "react";

export interface User {
  _id: string;
  name: string;
  email: string;
  profileSetup: boolean;
  avatar?: string;
  bio?: string;
  phone?: string;
  location?: string;
  website?: string;
  firstName?: string;
  lastName?: string;
  image?: string;
  isOnline?: boolean;
  lastSeen?: Date;
}

export interface UsersResponse {
  users: User[];
  totalUsers: number;
}

export interface Message {
  _id?: string;
  id?: string;
  sender: string | User;
  messageType: "text" | "image" | "file";
  content: string;
  chatId: string;
  createdAt?: Date;
  timestamp?: Date;
  text?: string;
  isOptimistic?: boolean;
}

export interface BaseChat {
  _id: string;
  name?: string;
  memberCount?: number;
  unreadCount?: number;
  lastMessage?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserChat extends BaseChat {
  type: "user";
  participants: User[];
}

export interface ChannelChat extends BaseChat {
  type: "channel";
  description?: string;
  isPrivate: boolean;
  createdBy: string;
  admins: string[];
  members: string[];
}

export type Chat = UserChat | ChannelChat;
export type ChatOrNull = Chat | null;

export interface SelectedChatContextType {
  selectedChat: ChatOrNull;
  setSelectedChat: Dispatch<SetStateAction<ChatOrNull>>;
}

export interface AuthResponse {
  user: User;
  token?: string;
  message?: string;
}

export interface CreateChannelData {
  name: string;
  description?: string;
  isPrivate: boolean;
  memberIds: string[];
}

export interface UpdateChannelData {
  name?: string;
  description?: string;
  isPrivate?: boolean;
}

// Type guards
export const isUserChat = (chat: Chat): chat is UserChat => {
  return chat.type === "user";
};

export const isChannelChat = (chat: Chat): chat is ChannelChat => {
  return chat.type === "channel";
};

// Helper functions
export const getChatDisplayName = (
  chat: Chat,
  currentUserId?: string
): string => {
  if (isUserChat(chat)) {
    const otherParticipant = chat.participants?.find(
      (p) => p._id !== currentUserId
    );
    if (otherParticipant) {
      return (
        otherParticipant.name ||
        `${otherParticipant.firstName || ""} ${
          otherParticipant.lastName || ""
        }`.trim() ||
        otherParticipant.email ||
        "Unknown User"
      );
    }
    return "Unknown User";
  } else {
    return chat.name || "Unnamed Channel";
  }
};

export const getChatSubtitle = (chat: Chat, currentUserId?: string): string => {
  if (isUserChat(chat)) {
    const otherParticipant = chat.participants?.find(
      (p) => p._id !== currentUserId
    );
    if (otherParticipant) {
      if (otherParticipant.isOnline) return "Online";
      if (otherParticipant.lastSeen)
        return `Last seen ${formatTime(otherParticipant.lastSeen)}`;
      return "Offline";
    }
    return "";
  } else {
    return `${chat.memberCount || 0} members • ${
      chat.isPrivate ? "Private" : "Public"
    }`;
  }
};

export const formatTime = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const isUserAdmin = (chat: ChannelChat, userId?: string): boolean => {
  return !!userId && chat.admins.includes(userId);
};

export const isUserMember = (chat: ChannelChat, userId?: string): boolean => {
  return !!userId && chat.members.includes(userId);
};

export const canUserManageChannel = (
  chat: ChannelChat,
  userId?: string
): boolean => {
  return isUserAdmin(chat, userId) || chat.createdBy === userId;
};
