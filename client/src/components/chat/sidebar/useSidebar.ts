import { useState, useCallback, useMemo } from "react";
import { useApp } from "../../../contexts/appcontext/index";
import { useSocket } from "../../../hooks/useSocket";
import { useMarkAsRead } from "../../../hooks/useMarkAsRead";
import type { UserChat, ChannelChat, ChatOrNull } from "../../../types/types";
import { useChatContext } from "../../../hooks/useChatContext";

interface UseSidebarProps {
  directChats: UserChat[];
  channels: ChannelChat[];
  setSelectedChat: (chat: ChatOrNull) => void;
  handleSelectUser?: (userId: string) => void;
  getDisplayUnreadCount: (chat: UserChat) => number;
  getChannelDisplayUnreadCount: (channel: ChannelChat) => number;
  selectedChat?: ChatOrNull;
}

export const useSidebar = ({
  directChats,
  channels,
  setSelectedChat,
  handleSelectUser,
  getDisplayUnreadCount,
  getChannelDisplayUnreadCount,
  selectedChat,
}: UseSidebarProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);

  console.log({ channels });

  const { activeTab, setActiveTab } = useChatContext();

  const { state } = useApp();
  const { onlineUsers } = useSocket();
  const markAsReadMutation = useMarkAsRead();

  const safeOnlineUsers = useMemo(() => {
    return Array.isArray(onlineUsers) ? onlineUsers : [];
  }, [onlineUsers]);

  const handleUserSelect = useCallback(
    async (userId: string) => {
      try {
        if (handleSelectUser) {
          await handleSelectUser(userId);
        } else {
          console.warn("handleSelectUser not provided for user:", userId);
        }
        setShowNewChatModal(false);
      } catch (error) {
        console.error("Failed to create chat:", error);
      }
    },
    [handleSelectUser]
  );

  const handleChatSelect = useCallback(
    (chat: ChatOrNull) => {
      if (!chat) {
        setSelectedChat(null);
        return;
      }

      setSelectedChat(chat);

      const unreadCount =
        chat.type === "direct"
          ? getDisplayUnreadCount(chat as UserChat)
          : getChannelDisplayUnreadCount(chat as ChannelChat);

      if (unreadCount > 0) {
        markAsReadMutation.mutate(chat._id);
      }
    },
    [
      setSelectedChat,
      getDisplayUnreadCount,
      getChannelDisplayUnreadCount,
      markAsReadMutation,
    ]
  );

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const openNewChatModal = useCallback(() => {
    setShowNewChatModal(true);
  }, []);

  const closeNewChatModal = useCallback(() => {
    setShowNewChatModal(false);
  }, []);

  const handleTabChange = useCallback(
    (tab: "direct" | "channels") => {
      setActiveTab(tab);
    },
    [setActiveTab]
  );

  const enhancedChats = useMemo(() => {
    return directChats?.map((chat) => {
      if (chat.type === "direct" && chat.participants) {
        return {
          ...chat,
          participants: chat.participants.map((participant) => {
            const onlineUser = safeOnlineUsers.find(
              (u) => u._id === participant._id
            );
            return {
              ...participant,
              isOnline: onlineUser?.isOnline || false,
              lastSeen: onlineUser?.lastSeen || participant.lastSeen,
            };
          }),
        };
      }
      return chat;
    });
  }, [directChats, safeOnlineUsers]);

  const sortedDirectChats = useMemo(() => {
    if (!enhancedChats) return [];

    return [...enhancedChats].sort((a, b) => {
      if (selectedChat && a._id === selectedChat._id) return -1;
      if (selectedChat && b._id === selectedChat._id) return 1;

      const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;

      const createTimeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const createTimeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

      const finalTimeA = timeA || createTimeA;
      const finalTimeB = timeB || createTimeB;

      return finalTimeB - finalTimeA;
    });
  }, [enhancedChats, selectedChat]);

  const sortedChannels = useMemo(() => {
    if (!channels) return [];

    return [...channels].sort((a, b) => {
      if (selectedChat && a._id === selectedChat._id) return -1;
      if (selectedChat && b._id === selectedChat._id) return 1;

      const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;

      const createTimeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const createTimeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

      const finalTimeA = timeA || createTimeA;
      const finalTimeB = timeB || createTimeB;

      return finalTimeB - finalTimeA;
    });
  }, [channels, selectedChat]);

  return {
    sidebarCollapsed,
    showNewChatModal,
    activeTab,
    setActiveTab: handleTabChange,
    handleUserSelect,
    handleChatSelect,
    toggleSidebar,
    openNewChatModal,
    closeNewChatModal,
    sortedDirectChats,
    sortedChannels,
    currentUser: state.user,
  };
};
