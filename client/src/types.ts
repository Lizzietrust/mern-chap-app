export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'other';
  timestamp: Date;
  isTyping?: boolean;
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
  type: 'user' | 'channel';
  id: string;
} | null;