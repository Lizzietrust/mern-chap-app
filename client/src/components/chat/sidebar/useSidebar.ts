import { useState, useCallback, useMemo } from "react";
import { useApp } from "../../../contexts/appcontext/index";
import { useSocket } from "../../../hooks/useSocket";
import { useMarkAsRead } from "../../../hooks/useMarkAsRead";
import type { UserChat, ChannelChat, ChatOrNull } from "../../../types/types";

interface UseSidebarProps {
  directChats: UserChat[];
  channels: ChannelChat[];
  setSelectedChat: (chat: ChatOrNull) => void;
  handleSelectUser?: (userId: string) => void;
  getDisplayUnreadCount: (chat: UserChat) => number;
  getChannelDisplayUnreadCount: (channel: ChannelChat) => number;
}

export const useSidebar = ({
  directChats,
  channels,
  setSelectedChat,
  handleSelectUser,
  getDisplayUnreadCount,
  getChannelDisplayUnreadCount,
}: UseSidebarProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"direct" | "channels">("direct");

  const { state } = useApp();
  const { onlineUsers } = useSocket();
  const markAsReadMutation = useMarkAsRead();

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

  const enhancedChats = useMemo(() => {
    return directChats?.map((chat) => {
      if (chat.type === "direct" && chat.participants) {
        return {
          ...chat,
          participants: chat.participants.map((participant) => {
            const onlineUser = onlineUsers.find(
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
  }, [directChats, onlineUsers]);

  const sortedDirectChats = useMemo(() => {
    return enhancedChats?.sort((a, b) => {
      const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return timeB - timeA;
    });
  }, [enhancedChats]);

  const sortedChannels = useMemo(() => {
    return channels?.sort((a, b) => {
      const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return timeB - timeA;
    });
  }, [channels]);

  return {
    sidebarCollapsed,
    showNewChatModal,
    activeTab,
    setActiveTab,
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
