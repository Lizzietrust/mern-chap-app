import { PlusIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import { useApp } from "../../contexts/AppContext";
import { getInitials } from "../../functions";
import NewChatModal from "./new-chat-modal/NewChatModal";
import type {
  ChatOrNull,
  User,
  UserChat,
  ChannelChat,
} from "../../types/types";
import { useSocket } from "../../contexts/useSocket";
import { useMarkAsRead } from "../../hooks/useMarkAsRead";

interface Props {
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
  onShowChannelSettings: () => void;
  channelsLoading: boolean;
  getDisplayUnreadCount: (chat: UserChat) => number;
  getChannelDisplayUnreadCount: (channel: ChannelChat) => number;
}

const Sidebar = ({
  isDark,
  selectedChat,
  users,
  setSelectedChat,
  channels,
  handleSelectUser,
  directChats,
  currentPage,
  totalUsers,
  onPageChange,
  onSearch,
  isLoadingUsers = false,
  searchTerm,
  handleSearch,
  onCreateChannel,
  getDisplayUnreadCount,
  getChannelDisplayUnreadCount,
}: Props) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"dms" | "channels">("dms");
  const { state } = useApp();
  const { onlineUsers } = useSocket();
  const markAsReadMutation = useMarkAsRead();

  const handleUserSelect = async (userId: string) => {
    try {
      await handleSelectUser(userId);
      setShowNewChatModal(false);
    } catch (error) {
      console.error("Failed to create chat:", error);
    }
  };

  const handleChannelClick = (channel: ChannelChat) => {
    setSelectedChat(channel);
  };

  const formatLastMessageTime = (
    timestamp: Date | string | undefined
  ): string => {
    if (!timestamp) return "";

    const date =
      typeof timestamp === "string" ? new Date(timestamp) : timestamp;
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInHours / 24;

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return diffInMinutes < 1 ? "now" : `${diffInMinutes}m`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)}d`;
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const enhancedChats = directChats?.map((chat) => {
    if (chat.type === "direct" && chat.participants) {
      return {
        ...chat,
        participants: chat.participants.map((participant) => {
          const onlineUser = onlineUsers.find((u) => u._id === participant._id);
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

  console.log("Sidebar Data Debug:", {
    chats: directChats, // Check if this contains direct messages
    channels: channels,
    users: users,
    currentUser: state.user,
  });

  const sortedDirectChats = enhancedChats?.sort((a, b) => {
    const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return timeB - timeA;
  });

  // Sort channels by last message time (most recent first)
  const sortedChannels = channels?.sort((a, b) => {
    const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return timeB - timeA;
  });

  const handleChatSelect = (chat: UserChat | ChannelChat) => {
    setSelectedChat(chat);

    // Mark as read if there are unread messages
    const unreadCount =
      "type" in chat && chat.type === "direct"
        ? getDisplayUnreadCount(chat as UserChat)
        : getChannelDisplayUnreadCount(chat as ChannelChat);

    if (unreadCount > 0) {
      markAsReadMutation.mutate(chat._id);
    }
  };

  // Helper function to get display name for a user
  const getDisplayName = (user: User): string => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) {
      return user.firstName;
    }
    if (user.name) {
      return user.name;
    }
    return user.email || "Unknown User";
  };

  // Helper function to get display name for message sender
  const getSenderDisplayName = (sender: User): string => {
    if (!sender) return "Unknown User";

    if (typeof sender === "object") {
      if (sender.firstName && sender.lastName) {
        return `${sender.firstName} ${sender.lastName}`;
      }
      if (sender.firstName) {
        return sender.firstName;
      }
      if (sender.name) {
        return sender.name;
      }
      if (sender.email) {
        return sender.email;
      }
    }

    return "Unknown User";
  };

  return (
    <>
      <div
        className={`${
          sidebarCollapsed ? "md:w-16" : "md:w-80"
        } w-full flex-col border-r transition-all duration-300 ${
          isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        } ${selectedChat ? "hidden md:flex" : "flex"}`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2">
                <h2
                  className={`font-bold text-lg ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {activeTab === "dms" ? "Messages" : "Channels"}
                </h2>
                {activeTab === "dms" && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setShowNewChatModal(true)}
                      className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${
                        isDark ? "text-gray-300" : "text-gray-600"
                      }`}
                      title="New Chat"
                    >
                      <PlusIcon className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer hidden md:block ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? "→" : "←"}
            </button>
          </div>

          {!sidebarCollapsed && (
            <div className="mt-4">
              <div
                className={`flex p-1 rounded-lg ${
                  isDark ? "bg-gray-700" : "bg-gray-100"
                }`}
              >
                <button
                  onClick={() => setActiveTab("dms")}
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                    activeTab === "dms"
                      ? isDark
                        ? "bg-gray-600 text-white"
                        : "bg-white text-gray-900 shadow-sm"
                      : isDark
                      ? "text-gray-300 hover:text-white"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Direct Messages
                </button>
                <button
                  onClick={() => setActiveTab("channels")}
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                    activeTab === "channels"
                      ? isDark
                        ? "bg-gray-600 text-white"
                        : "bg-white text-gray-900 shadow-sm"
                      : isDark
                      ? "text-gray-300 hover:text-white"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Channels
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Chat List */}
        <div
          className={`flex-1 overflow-y-auto ${
            sidebarCollapsed ? "hidden md:block" : ""
          }`}
        >
          {!sidebarCollapsed ? (
            <>
              {activeTab === "dms" && (
                <div className="p-2">
                  {sortedDirectChats?.map((chat) => {
                    if (!chat) return null;

                    const otherParticipant = chat.participants?.find(
                      (p) => p._id !== state.user?._id
                    );

                    console.log("Chat debug:", {
                      chatId: chat._id,
                      participants: chat.participants,
                      otherParticipant,
                      currentUserId: state.user?._id,
                    });

                    // Use the getDisplayUnreadCount function here
                    const unreadCount = getDisplayUnreadCount(chat);
                    const lastMessage = chat.lastMessage || "";
                    const lastMessageTime = formatLastMessageTime(
                      chat.lastMessageAt
                    );
                    const isSelected = selectedChat?._id === chat._id;
                    const hasUnread = unreadCount > 0 && !isSelected;

                    return (
                      <button
                        key={chat._id}
                        onClick={() => handleChatSelect(chat)}
                        className={`w-full p-3 rounded-lg mb-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 overflow-hidden transition-colors cursor-pointer ${
                          isSelected
                            ? isDark
                              ? "bg-gray-700"
                              : "bg-gray-100"
                            : ""
                        } ${hasUnread ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                              {otherParticipant?.image ? (
                                <img
                                  className="w-10 h-10 rounded-full"
                                  src={otherParticipant.image}
                                  alt="User avatar"
                                />
                              ) : (
                                <div>
                                  {otherParticipant?.firstName?.charAt(0) ||
                                    otherParticipant?.name?.charAt(0) ||
                                    "U"}
                                </div>
                              )}
                            </div>
                            {otherParticipant?.isOnline && (
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p
                                className={`font-medium truncate ${
                                  isDark ? "text-white" : "text-gray-900"
                                } ${hasUnread ? "font-semibold" : ""}`}
                              >
                                {otherParticipant
                                  ? getDisplayName(otherParticipant)
                                  : "Unknown User"}
                              </p>
                              <div className="flex items-center space-x-2">
                                {lastMessageTime && (
                                  <span
                                    className={`text-xs whitespace-nowrap ${
                                      isDark ? "text-gray-400" : "text-gray-500"
                                    } ${
                                      hasUnread
                                        ? "text-blue-500 dark:text-blue-400"
                                        : ""
                                    }`}
                                  >
                                    {lastMessageTime}
                                  </span>
                                )}
                                {unreadCount > 0 && (
                                  <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                    {unreadCount}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <p
                                className={`text-sm truncate flex-1 ${
                                  isDark ? "text-gray-400" : "text-gray-500"
                                } ${
                                  hasUnread
                                    ? "text-blue-600 dark:text-blue-400 font-medium"
                                    : ""
                                }`}
                              >
                                {lastMessage || "No messages yet"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {activeTab === "channels" && (
                <div className="p-2">
                  {/* Create Channel Button */}
                  <button
                    onClick={onCreateChannel}
                    className={`w-full p-3 rounded-lg mb-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer border border-dashed ${
                      isDark
                        ? "border-gray-600 text-gray-300 hover:border-gray-500"
                        : "border-gray-300 text-gray-600 hover:border-gray-400"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center text-white font-semibold">
                        <PlusIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-medium ${
                            isDark ? "text-white" : "text-gray-900"
                          }`}
                        >
                          Create New Channel
                        </p>
                        <p
                          className={`text-sm ${
                            isDark ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Start a new channel conversation
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Channels List */}
                  {sortedChannels?.map((channel) => {
                    const lastMessageTime = formatLastMessageTime(
                      channel.lastMessageAt
                    );
                    const isSelected = selectedChat?._id === channel._id;

                    // Use the getChannelDisplayUnreadCount function here
                    const unreadCount = getChannelDisplayUnreadCount(channel);
                    const hasUnread = unreadCount > 0 && !isSelected;

                    return (
                      <button
                        key={channel._id}
                        onClick={() => handleChatSelect(channel)}
                        className={`w-full p-3 rounded-lg mb-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                          isSelected
                            ? isDark
                              ? "bg-gray-700"
                              : "bg-gray-100"
                            : ""
                        } ${hasUnread ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              channel.isPrivate
                                ? "bg-orange-500"
                                : "bg-green-500"
                            } text-white font-semibold`}
                          >
                            {channel.isPrivate ? "🔒" : "#"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p
                                className={`font-medium truncate ${
                                  isDark ? "text-white" : "text-gray-900"
                                } ${hasUnread ? "font-semibold" : ""}`}
                              >
                                {channel.name}
                              </p>
                              <div className="flex items-center space-x-2">
                                {lastMessageTime && (
                                  <span
                                    className={`text-xs whitespace-nowrap ${
                                      isDark ? "text-gray-400" : "text-gray-500"
                                    } ${
                                      hasUnread
                                        ? "text-blue-500 dark:text-blue-400"
                                        : ""
                                    }`}
                                  >
                                    {lastMessageTime}
                                  </span>
                                )}
                                {unreadCount > 0 && (
                                  <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                    {unreadCount}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <p
                                className={`text-sm truncate flex-1 ${
                                  isDark ? "text-gray-400" : "text-gray-500"
                                } ${
                                  hasUnread
                                    ? "text-blue-600 dark:text-blue-400 font-medium"
                                    : ""
                                }`}
                              >
                                {channel.lastMessage ? (
                                  <>
                                    {channel.lastMessage}
                                    {channel.lastMessageSender && (
                                      <span className="ml-1 opacity-75">
                                        •{" "}
                                        {getSenderDisplayName(
                                          channel.lastMessageSender
                                        )}
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    {`${channel.memberCount || 0} members`}
                                    {channel.description &&
                                      ` • ${channel.description}`}
                                  </>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  {channels?.length === 0 && (
                    <div
                      className={`text-center py-8 ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      <div className="text-4xl mb-4">🏗️</div>
                      <p>No channels yet</p>
                      <p className="text-sm mt-1">
                        Create your first channel to get started
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              {activeTab === "dms" && (
                <div className="p-2">
                  {sortedDirectChats?.map((chat) => {
                    if (!chat) return null;

                    const otherParticipant = chat.participants?.find(
                      (p) => p._id !== state.user?._id
                    );

                    console.log("Chat debug:", {
                      chatId: chat._id,
                      participants: chat.participants,
                      otherParticipant,
                      currentUserId: state.user?._id,
                    });

                    // Use the getDisplayUnreadCount function here
                    const unreadCount = getDisplayUnreadCount(chat);
                    const lastMessage = chat.lastMessage || "";
                    const lastMessageTime = formatLastMessageTime(
                      chat.lastMessageAt
                    );
                    const isSelected = selectedChat?._id === chat._id;
                    const hasUnread = unreadCount > 0 && !isSelected;

                    return (
                      <button
                        key={chat._id}
                        onClick={() => handleChatSelect(chat)}
                        className={`w-full flex flex-col p-1 items-center justify-center rounded-lg mb-4 text-center hover:bg-gray-50 dark:hover:bg-gray-700 overflow-hidden transition-colors cursor-pointer ${
                          isSelected
                            ? isDark
                              ? "bg-gray-700"
                              : "bg-gray-100"
                            : ""
                        } ${hasUnread ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
                      >
                        <div className="flex flex-col items-center space-x-3">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                              {otherParticipant?.image ? (
                                <img
                                  className="w-10 h-10 rounded-full"
                                  src={otherParticipant.image}
                                  alt="User avatar"
                                />
                              ) : (
                                <div>
                                  {otherParticipant?.firstName?.charAt(0) ||
                                    otherParticipant?.name?.charAt(0) ||
                                    "U"}
                                </div>
                              )}
                            </div>
                            {otherParticipant?.isOnline && (
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {activeTab === "channels" && (
                <div className="p-2">
                  {/* Create Channel Button */}
                  <button
                    onClick={onCreateChannel}
                    className={`w-full ${
                      sidebarCollapsed ? "p-1" : "p-3"
                    } rounded-lg mb-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer border border-dashed ${
                      isDark
                        ? "border-gray-600 text-gray-300 hover:border-gray-500"
                        : "border-gray-300 text-gray-600 hover:border-gray-400"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center text-white font-semibold">
                        <PlusIcon className="h-5 w-5" />
                      </div>
                    </div>
                  </button>

                  {/* Channels List */}
                  {sortedChannels?.map((channel) => {
                    const lastMessageTime = formatLastMessageTime(
                      channel.lastMessageAt
                    );
                    const isSelected = selectedChat?._id === channel._id;

                    // Use the getChannelDisplayUnreadCount function here
                    const unreadCount = getChannelDisplayUnreadCount(channel);
                    const hasUnread = unreadCount > 0 && !isSelected;

                    return (
                      <button
                        key={channel._id}
                        onClick={() => handleChatSelect(channel)}
                        className={`w-full ${
                          sidebarCollapsed ? "p-1" : "p-3"
                        } rounded-lg mb-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                          isSelected
                            ? isDark
                              ? "bg-gray-700"
                              : "bg-gray-100"
                            : ""
                        } ${hasUnread ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              channel.isPrivate
                                ? "bg-orange-500"
                                : "bg-green-500"
                            } text-white font-semibold`}
                          >
                            {channel.isPrivate ? "🔒" : "#"}
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  {channels?.length === 0 && (
                    <div
                      className={`text-center py-8 ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      <div className="text-4xl mb-4">🏗️</div>
                      <p>No channels yet</p>
                      <p className="text-sm mt-1">
                        Create your first channel to get started
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* User Profile Section */}
        <div
          className={`${sidebarCollapsed ? "p-2" : "p-4"} border-t ${
            isDark ? "border-gray-700" : "border-gray-200"
          }`}
        >
          {state.user ? (
            <div
              className={`flex items-center ${
                sidebarCollapsed ? "justify-center" : "space-x-3"
              }`}
            >
              <div className="relative">
                {state.user?.image ? (
                  <img
                    className="w-10 h-10 rounded-full object-cover cursor-pointer"
                    src={state.user.image}
                    alt="Your avatar"
                    title={
                      sidebarCollapsed
                        ? `${state.user.firstName} ${state.user.lastName}`
                        : ""
                    }
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold cursor-pointer"
                    title={
                      sidebarCollapsed
                        ? `${state.user.firstName} ${state.user.lastName}`
                        : ""
                    }
                  >
                    {getInitials(
                      state.user?.firstName || "",
                      state.user?.lastName || ""
                    )}
                  </div>
                )}
              </div>

              {/* User info - only show when sidebar is expanded */}
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-medium truncate ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {state.user?.firstName || ""} {state.user?.lastName || ""}
                  </p>
                  <p
                    className={`text-sm truncate ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {state.user?.email || ""}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div
              className={`flex items-center ${
                sidebarCollapsed ? "justify-center" : ""
              } ${isDark ? "text-white" : "text-black"}`}
            >
              <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse"></div>
              {!sidebarCollapsed && (
                <div className="ml-3 space-y-2">
                  <div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                  <div className="h-3 w-32 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <NewChatModal
          isDark={isDark}
          onClose={() => setShowNewChatModal(false)}
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

export default Sidebar;
