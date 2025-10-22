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
  createdAt: string;
  updatedAt: string;
}

export interface UsersResponse {
  users: User[];
  totalUsers: number;
}

export interface BaseMessage {
  _id: string;
  messageType: "text" | "image" | "file" | "audio" | "video";
  sender: string | User;
  chat: string | Chat;
  createdAt: Date | string;
  updatedAt?: Date | string;
  isOptimistic?: boolean;
  isSending?: boolean;
  failed?: boolean;
}

export interface TextMessage extends BaseMessage {
  messageType: "text";
  content: string;
  text?: string;
}

export interface FileMessage extends BaseMessage {
  messageType: "image" | "file" | "audio" | "video";
  fileUrl: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  content?: string;
  text?: string;
}

export type Message = TextMessage | FileMessage;

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
  members: string[] | User[];
  name?: string;
  lastMessage?: string;
  lastMessageAt?: Date;
  lastMessageSender?: User | string;
  unreadCount?: number;
}

export type Chat = UserChat | ChannelChat;
export type ChatOrNull = Chat | null;

export interface SelectedChatContextType {
  selectedChat: ChatOrNull;
  setSelectedChat: Dispatch<SetStateAction<ChatOrNull>>;
  clearSelectedChat: () => void;
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

export const isValidMessage = (message: unknown): message is Message => {
  if (!message || typeof message !== "object") return false;

  const msg = message as Record<string, unknown>;
  return !!(msg._id && msg.messageType && msg.sender);
};

export const isUserObject = (item: string | User): item is User => {
  return typeof item !== "string" && (item as User)._id !== undefined;
};

export const getUserId = (user: string | User): string => {
  return isUserObject(user) ? user._id : user;
};

export const getUserObject = (user: string | User): User | null => {
  return isUserObject(user) ? user : null;
};

export const isUserAdmin = (chat: ChannelChat, userId?: string): boolean => {
  if (!userId) return false;
  return chat.admins.includes(userId);
};

export const isUserMember = (chat: ChannelChat, userId?: string): boolean => {
  if (!userId) return false;

  return chat.members.some((member) => {
    if (isUserObject(member)) {
      return member._id === userId;
    } else {
      return member === userId;
    }
  });
};

export const canUserManageChannel = (
  chat: ChannelChat,
  userId?: string
): boolean => {
  return isUserAdmin(chat, userId) || chat.createdBy === userId;
};

export const getMemberCount = (chat: ChannelChat): number => {
  return chat.members.length;
};

export const getOnlineMemberCount = (
  chat: ChannelChat,
  onlineUsers: User[]
): number => {
  return chat.members.filter((member) => {
    const memberId = getUserId(member);
    return onlineUsers.some(
      (onlineUser) => onlineUser._id === memberId && onlineUser.isOnline
    );
  }).length;
};

export const getMemberObjects = (chat: ChannelChat): User[] => {
  return chat.members.map((member) => {
    if (isUserObject(member)) {
      return member;
    } else {
      return {
        _id: member,
        name: "Unknown User",
        email: "",
        profileSetup: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  });
};

export const getMessageContent = (message: Message): string => {
  if (isTextMessage(message)) {
    return message.content || message.text || "";
  }

  if (isFileMessage(message)) {
    return message.content || message.text || "";
  }

  const fallbackMessage = message as { content?: string; text?: string };
  return fallbackMessage.content || fallbackMessage.text || "";
};

export const getMessageFileUrl = (message: Message): string => {
  if (isFileMessage(message)) {
    return message.fileUrl;
  }
  return "";
};

export const getMessageFileName = (message: Message): string => {
  if (isFileMessage(message)) {
    return message.fileName || "file";
  }
  return "file";
};

export const getMessageFileSize = (message: Message): number | undefined => {
  if (isFileMessage(message)) {
    return message.fileSize;
  }
  return undefined;
};

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

export const getChatSubtitle = (
  chat: Chat,
  currentUserId?: string,
  onlineUsers: User[] = []
): string => {
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
    const channelChat = chat as ChannelChat;
    const totalMembers = getMemberCount(channelChat);
    const onlineMembers = getOnlineMemberCount(channelChat, onlineUsers);

    return `${totalMembers} members${
      onlineMembers > 0 ? ` • ${onlineMembers} online` : ""
    } • ${channelChat.isPrivate ? "Private" : "Public"}`;
  }
};

export const formatTime = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export interface LogoutModalProps {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  onConfirm: () => void;
  isLoading: boolean;
}

export type ThemeVariant = "dark" | "light";

export interface NotificationDemo {
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  delay?: number;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface StateCard {
  title: string;
  items: { label: string; value: string | boolean | number }[];
}

export interface ApiAuthResponse {
  user: User;
  token?: string;
  message?: string;
}
