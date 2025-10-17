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

// Unified Message Types
export interface BaseMessage {
  _id: string;
  messageType: "text" | "image" | "file" | "audio" | "video";
  sender: string | User;
  chat: string | Chat;
  createdAt: Date | string;
  updatedAt?: Date | string;
  // Optimistic messaging properties
  isOptimistic?: boolean;
  isSending?: boolean;
  failed?: boolean;
}

export interface TextMessage extends BaseMessage {
  messageType: "text";
  content: string;
  text?: string; // Alias for content
}

export interface FileMessage extends BaseMessage {
  messageType: "image" | "file" | "audio" | "video";
  fileUrl: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  content?: string; // Fallback content
  text?: string; // Fallback text
}

export type Message = TextMessage | FileMessage;

// Chat Types
export interface BaseChat {
  _id: string;
  type: "direct" | "channel";
  name?: string;
  memberCount?: number;
  unreadCount?: number;
  lastMessage?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserChat extends BaseChat {
  _id: string;
  type: "direct";
  participants: User[];
  lastMessage?: string;
  lastMessageAt?: Date;
  unreadCount?: number;
}

export interface ChannelChat extends BaseChat {
  _id: string;
  type: "channel";
  description?: string;
  isPrivate: boolean;
  createdBy: string;
  admins: string[];
  members: string[];
  name?: string;
  lastMessage?: string;
  lastMessageAt?: Date;
  unreadCount?: number;
}

export type Chat = UserChat | ChannelChat;
export type ChatOrNull = Chat | null;

// Context Types
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

// Type Guards
export const isDirectChat = (chat: Chat): chat is UserChat => {
  return chat.type === "direct";
};

export const isChannelChat = (chat: Chat): chat is ChannelChat => {
  return chat.type === "channel";
};

export const isTextMessage = (message: Message): message is TextMessage => {
  return message.messageType === "text";
};

export const isFileMessage = (message: Message): message is FileMessage => {
  return ["image", "file", "audio", "video"].includes(message.messageType);
};

export const isOptimisticMessage = (message: Message): boolean => {
  return !!(message.isOptimistic || message._id?.startsWith("temp-"));
};

export const isFailedMessage = (message: Message): boolean => {
  return !!message.failed;
};

export const isSendingMessage = (message: Message): boolean => {
  return !!message.isSending;
};

// Safe type guard for unknown message types
export const isValidMessage = (message: unknown): message is Message => {
  if (!message || typeof message !== "object") return false;

  const msg = message as Record<string, unknown>;
  return !!(msg._id && msg.messageType && msg.sender);
};

// Helper function to safely access message properties
export const getMessageContent = (message: Message): string => {
  if (isTextMessage(message)) {
    return message.content || message.text || "";
  }

  if (isFileMessage(message)) {
    return message.content || message.text || "";
  }

  // Fallback for any message type
  const fallbackMessage = message as { content?: string; text?: string };
  return fallbackMessage.content || fallbackMessage.text || "";
};

// Helper function to safely access file URL
export const getMessageFileUrl = (message: Message): string => {
  if (isFileMessage(message)) {
    return message.fileUrl;
  }
  return "";
};

// Helper function to safely access file name
export const getMessageFileName = (message: Message): string => {
  if (isFileMessage(message)) {
    return message.fileName || "file";
  }
  return "file";
};

// Helper function to safely access file size
export const getMessageFileSize = (message: Message): number | undefined => {
  if (isFileMessage(message)) {
    return message.fileSize;
  }
  return undefined;
};

// Helper Functions
export const getChatDisplayName = (
  chat: Chat,
  currentUserId?: string
): string => {
  if (isDirectChat(chat)) {
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
  if (isDirectChat(chat)) {
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
