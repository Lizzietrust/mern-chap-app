import type { Dispatch, SetStateAction } from "react";
import type { ChatOrNull, User, UserChat, ChannelChat } from "./types";

export interface SidebarProps {
  isDark: boolean;
  selectedChat: ChatOrNull;
  users?: User[];
  directChats: UserChat[];
  channels: ChannelChat[];
  setSelectedChat: Dispatch<SetStateAction<ChatOrNull>>;
  handleSelectUser?: (userId: string) => void;
  currentPage: number;
  totalUsers: number;
  onPageChange: (page: number) => void;
  onSearch: (search: string) => void;
  isLoadingUsers?: boolean;
  searchTerm: string;
  handleSearch: (search: string) => void;
  onCreateChannel: () => void;
  onShowChannelSettings: () => void;
  getDisplayUnreadCount: (chat: UserChat) => number;
  getChannelDisplayUnreadCount: (channel: ChannelChat) => number;
}

// In your Sidebar.types.ts
export interface SidebarHeaderProps {
  isDark: boolean;
  sidebarCollapsed: boolean;
  activeTab: "direct" | "channels";
  onToggleSidebar: () => void;
  onTabChange: (tab: "direct" | "channels") => void;
  onNewChat: () => void;
  totalUnreadCount?: number;
  directUnreadCount?: number;
  channelUnreadCount?: number;
}

export interface UserProfileProps {
  user: User | null;
  sidebarCollapsed: boolean;
  isDark: boolean;
  unreadCount?: number;
}

export interface ChatListProps {
  isDark: boolean;
  sidebarCollapsed: boolean;
  activeTab: "direct" | "channels";
  selectedChat: ChatOrNull;
  onChatSelect: (chat: ChatOrNull) => void;
  onCreateChannel: () => void;
  onShowChannelSettings: () => void;
  directChats: UserChat[];
  channels: ChannelChat[];
  getDisplayUnreadCount: (chat: UserChat) => number;
  getChannelDisplayUnreadCount: (channel: ChannelChat) => number;
}

export interface ChannelsListProps {
  isDark: boolean;
  channels: ChannelChat[];
  selectedChat: ChatOrNull;
  onChatSelect: (chat: ChatOrNull) => void;
  onCreateChannel: () => void;
  onShowChannelSettings: () => void;
  collapsed: boolean;
  getDisplayUnreadCount: (channel: ChannelChat) => number;
}

export interface ChatItemProps {
  chat: UserChat;
  isSelected: boolean;
  hasUnread: boolean;
  unreadCount: number;
  displayName: string;
  lastMessage: string;
  lastMessageTime: string;
  isOnline: boolean;
  userImage?: string;
  initials: string;
  onSelect: () => void;
  isDark: boolean;
  sidebarCollapsed: boolean;
}

export interface ChannelItemProps {
  channel: ChannelChat;
  isSelected: boolean;
  hasUnread: boolean;
  unreadCount: number;
  lastMessageTime: string;
  onSelect: () => void;
  isDark: boolean;
  sidebarCollapsed: boolean;
  displayText: string;
  onShowSettings?: () => void;
}

export interface UserProfileProps {
  user: User | null;
  sidebarCollapsed: boolean;
  isDark: boolean;
}
