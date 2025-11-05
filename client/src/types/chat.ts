import type { UserChat, ChannelChat, Chat, Message } from "./types";

export interface SendMessageData {
  chatId: string;
  messageType: "text" | "image" | "file";
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  content: string;
}

export interface SendMessageResponse {
  success: boolean;
  message?: Message;
  _id?: string;
  chatId?: string;
}

export interface UploadFileResponse {
  fileUrl: string;
  fileName: string;
  fileSize: number;
}

export interface ChatQueryOptions {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  retry?: boolean | number;
}

export const isUserChat = (chat: Chat): chat is UserChat => {
  return chat.type === "direct";
};

export const isChannelChat = (chat: Chat): chat is ChannelChat => {
  return chat.type === "channel";
};

export interface ChatSubtitleConfig {
  showMemberCount?: boolean;
  showPrivacyStatus?: boolean;
  showLastSeen?: boolean;
  timeFormat?: "12h" | "24h";
}

export interface UserStatus {
  isOnline: boolean;
  lastSeen?: Date;
  statusText: string;
}
