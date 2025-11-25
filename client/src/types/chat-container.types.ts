import type { Dispatch, SetStateAction } from "react";
import type { Message, ChatOrNull, Chat, User } from "./types";

export interface ChatContainerProps {
  selectedChat: ChatOrNull;
  isDark: boolean;
  setSelectedChat: Dispatch<SetStateAction<ChatOrNull>>;
  getChatTitle: () => string;
  getChatImage: () => string;
  messages: Message[];
  formatTime: (date: Date | string) => string;
  isTyping: boolean;
  messagesEndRef?: React.RefObject<HTMLDivElement | null>;
  handleSendMessage: (e: React.FormEvent) => void;
  handleFileSelect: (file: File) => void;
  newMessage: string;
  setNewMessage: (message: string) => void;
  isSending?: boolean;
  onShowChannelSettings: () => void;
  stateUser: User;
}

export interface MessageDisplayProps {
  message: Message;
  isCurrentUser: boolean;
  showSenderName: boolean;
  senderName: string;
  isDark: boolean;
  formatTime: (timestamp: Date | string) => string;
  onDownloadFile: (fileUrl: string, fileName: string) => void;
}

export interface ChatHeaderProps {
  selectedChat: Chat;
  isDark: boolean;
  onBack: () => void;
  title: string;
  image: string;
  subtitle: string;
  onSearch: () => void;
  onMenu: () => void;
  onParticipants?: () => void;
  onSettings?: () => void;
}

export interface MessageInputProps {
  newMessage: string;
  isSending: boolean;
  isDark: boolean;
  placeholder: string;
  onMessageChange: (message: string) => void;
  onSendMessage: (e: React.FormEvent<HTMLFormElement>) => void;
  onFileSelect: (file: File) => void;
}

export interface TypingIndicatorProps {
  isDark: boolean;
}
