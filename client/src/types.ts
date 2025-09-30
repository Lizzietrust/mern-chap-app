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
}

export interface UserChat extends BaseChat {
  type: "user";
  participants?: User[];
}

export interface ChannelChat extends BaseChat {
  type: "channel";
  description?: string;
  isPrivate?: boolean;
}

export type Chat = UserChat | ChannelChat;
export type ChatOrNull = Chat | null;

export interface Channel {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  unreadCount?: number;
  isPrivate?: boolean;
}

export type SelectedChatContextType = {
  selectedChat: ChatOrNull;
  setSelectedChat: Dispatch<SetStateAction<ChatOrNull>>;
};

export interface AuthResponse {
  user: User;
  token?: string;
  message?: string;
}

export interface UserChatWithMetadata extends UserChat {
  lastActivity?: Date;
  isTyping?: boolean;
}

export interface ChannelChatWithMetadata extends ChannelChat {
  createdAt?: Date;
  ownerId?: string;
}
