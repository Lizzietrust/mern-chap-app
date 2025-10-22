import React from "react";
import { useSidebar } from "./useSidebar";
import { SidebarHeader } from "./SidebarHeader";
import { ChatList } from "./chatlist/ChatList";
import { UserProfile } from "./chatlist/UserProfile";
import NewChatModal from "../new-chat-modal/NewChatModal";
import type { SidebarProps } from "../../../types/Sidebar.types";

const Sidebar: React.FC<SidebarProps> = ({
  isDark,
  selectedChat,
  users,
  setSelectedChat,
  channels,
  directChats,
  handleSelectUser,
  currentPage,
  totalUsers,
  onPageChange,
  onSearch,
  isLoadingUsers = false,
  searchTerm,
  handleSearch,
  onCreateChannel,
  onShowChannelSettings,
  getDisplayUnreadCount,
  getChannelDisplayUnreadCount,
}) => {
  const {
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
    currentUser,
  } = useSidebar({
    directChats,
    channels,
    setSelectedChat,
    handleSelectUser,
    getDisplayUnreadCount,
    getChannelDisplayUnreadCount,
  });

  const totalUnreadCount = React.useMemo(() => {
    const directUnread =
      sortedDirectChats?.reduce((total, chat) => {
        return total + (getDisplayUnreadCount(chat) || 0);
      }, 0) || 0;

    const channelUnread =
      sortedChannels?.reduce((total, channel) => {
        return total + (getChannelDisplayUnreadCount(channel) || 0);
      }, 0) || 0;

    return directUnread + channelUnread;
  }, [
    sortedDirectChats,
    sortedChannels,
    getDisplayUnreadCount,
    getChannelDisplayUnreadCount,
  ]);

  const directUnreadCount = React.useMemo(() => {
    return (
      sortedDirectChats?.reduce((total, chat) => {
        return total + (getDisplayUnreadCount(chat) || 0);
      }, 0) || 0
    );
  }, [sortedDirectChats, getDisplayUnreadCount]);

  const channelUnreadCount = React.useMemo(() => {
    return (
      sortedChannels?.reduce((total, channel) => {
        return total + (getChannelDisplayUnreadCount(channel) || 0);
      }, 0) || 0
    );
  }, [sortedChannels, getChannelDisplayUnreadCount]);

  return (
    <>
      <div
        className={`${
          sidebarCollapsed ? "md:w-16" : "md:w-80"
        } w-full flex-col border-r transition-all duration-300 ${
          isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        } ${selectedChat ? "hidden md:flex" : "flex"}`}
      >
        <SidebarHeader
          isDark={isDark}
          sidebarCollapsed={sidebarCollapsed}
          activeTab={activeTab}
          onToggleSidebar={toggleSidebar}
          onTabChange={setActiveTab}
          onNewChat={openNewChatModal}
          totalUnreadCount={totalUnreadCount}
          directUnreadCount={directUnreadCount}
          channelUnreadCount={channelUnreadCount}
        />

        <ChatList
          isDark={isDark}
          sidebarCollapsed={sidebarCollapsed}
          activeTab={activeTab}
          selectedChat={selectedChat}
          onChatSelect={handleChatSelect}
          onCreateChannel={onCreateChannel}
          onShowChannelSettings={onShowChannelSettings}
          directChats={sortedDirectChats || []}
          channels={sortedChannels || []}
          getDisplayUnreadCount={getDisplayUnreadCount}
          getChannelDisplayUnreadCount={getChannelDisplayUnreadCount}
        />

        <div
          className={`${sidebarCollapsed ? "p-2" : "p-4"} border-t ${
            isDark ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <UserProfile
            user={currentUser}
            sidebarCollapsed={sidebarCollapsed}
            isDark={isDark}
            unreadCount={sidebarCollapsed ? totalUnreadCount : undefined}
          />
        </div>
      </div>

      {showNewChatModal && (
        <NewChatModal
          isDark={isDark}
          onClose={closeNewChatModal}
          users={users || []}
          handleSelectUser={handleUserSelect}
          currentPage={currentPage}
          totalUsers={totalUsers}
          onPageChange={onPageChange}
          onSearch={onSearch}
          isLoading={isLoadingUsers}
          searchTerm={searchTerm}
          onSearchTermChange={handleSearch}
        />
      )}
    </>
  );
};

export default React.memo(Sidebar);
