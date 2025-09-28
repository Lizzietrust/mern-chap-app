export interface Message {
  _id?: string;
  id?: string;
  sender:
    | string
    | {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
        image?: string;
      };
  messageType: "text" | "image" | "file";
  content: string;
  chatId: string;
  createdAt?: Date;
  timestamp?: Date;
  text?: string;
}

export interface User {
  id: string;
  name: string;
  avatar?: string;
  isOnline: boolean;
  lastMessage?: string;
  unreadCount?: number;
  lastSeen?: Date;
}

export interface Channel {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  unreadCount?: number;
  isPrivate?: boolean;
}

export type Chat = {
  type: "user" | "channel";
  _id: string;
} | null;

// types.ts
export interface AuthResponse {
  user: {
    _id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    image?: string;
    bio?: string;
    phone?: string;
    location?: string;
    website?: string;
    profileSetup: boolean;
    createdAt?: string;
    updatedAt?: string;
  };
}
