import type { ChatOrNull, User, UserChat, ChannelChat } from "./types";

export interface SidebarProps {
  isDark: boolean;
  selectedChat: ChatOrNull;
  users?: User[];
  setSelectedChat: (chat: ChatOrNull) => void;
  channels: ChannelChat[];
  directChats: UserChat[];
  handleSelectUser: (userId: string) => void;
  currentPage: number;
  totalUsers: number;
  onPageChange: (page: number) => void;
  onSearch: (searchTerm: string) => void;
  isLoadingUsers?: boolean;
  searchTerm: string;
  handleSearch: (searchTerm: string) => void;
  onCreateChannel: () => void;
  getDisplayUnreadCount: (chat: UserChat) => number;
  getChannelDisplayUnreadCount: (channel: ChannelChat) => number;
}

export interface SidebarHeaderProps {
  isDark: boolean;
  sidebarCollapsed: boolean;
  activeTab: "dms" | "channels";
  onToggleSidebar: () => void;
  onTabChange: (tab: "dms" | "channels") => void;
  onNewChat: () => void;
}

export interface ChatListProps {
  isDark: boolean;
  sidebarCollapsed: boolean;
  activeTab: "dms" | "channels";
  selectedChat: ChatOrNull;
  onChatSelect: (chat: UserChat | ChannelChat) => void;
  onCreateChannel: () => void;
  directChats: UserChat[];
  channels: ChannelChat[];
  getDisplayUnreadCount: (chat: UserChat) => number;
  getChannelDisplayUnreadCount: (channel: ChannelChat) => number;
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
}

export interface UserProfileProps {
  user: User | null;
  sidebarCollapsed: boolean;
  isDark: boolean;
}
