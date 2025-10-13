import { PlusIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import { useApp } from "../../contexts/AppContext";
import { getInitials } from "../../functions";
import NewChatModal from "./NewChatModal";
import type { ChatOrNull, User, UserChat, ChannelChat } from "../../types";
import { useSocket } from "../../contexts/useSocket";

interface Props {
  isDark: boolean;
  selectedChat: ChatOrNull;
  users?: User[];
  setSelectedChat: (chat: ChatOrNull) => void;
  channels: ChannelChat[];
  handleSelectUser: (userId: string) => void;
  chats?: UserChat[];
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
}

const Sidebar = ({
  isDark,
  selectedChat,
  users,
  setSelectedChat,
  channels,
  handleSelectUser,
  chats,
  currentPage,
  totalUsers,
  onPageChange,
  onSearch,
  isLoadingUsers = false,
  searchTerm,
  handleSearch,
  onCreateChannel,
}: // channelsLoading,
// onShowChannelSettings,
Props) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"dms" | "channels">("dms");
  const { state } = useApp();
  const { onlineUsers } = useSocket();

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

  // In your Sidebar component, enhance the participants with online status
  const enhancedChats = chats?.map((chat) => {
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
          {!sidebarCollapsed && (
            <>
              {activeTab === "dms" && (
                <div className="p-2">
                  {enhancedChats?.map((chat) => {
                    if (!chat) return null;

                    const otherParticipant = chat.participants?.find(
                      (p) => p._id !== state.user?._id
                    );

                    const unreadCount = chat.unreadCount || 0;
                    const lastMessage = chat.lastMessage || "";

                    return (
                      <button
                        key={chat._id}
                        onClick={() => setSelectedChat(chat)}
                        className={`w-full p-3 rounded-lg mb-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 overflow-hidden transition-colors cursor-pointer ${
                          selectedChat?._id === chat._id
                            ? isDark
                              ? "bg-gray-700"
                              : "bg-gray-100"
                            : ""
                        }`}
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
                                    "U"}
                                </div>
                              )}
                            </div>
                            {otherParticipant?.isOnline && (
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p
                                className={`font-medium truncate ${
                                  isDark ? "text-white" : "text-gray-900"
                                }`}
                              >
                                {otherParticipant?.firstName || "Unknown"}{" "}
                                {otherParticipant?.lastName || "User"}
                              </p>
                              {unreadCount > 0 && (
                                <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                  {unreadCount}
                                </span>
                              )}
                            </div>
                            {lastMessage && (
                              <p
                                className={`text-sm truncate ${
                                  isDark ? "text-gray-400" : "text-gray-500"
                                }`}
                              >
                                {lastMessage}
                              </p>
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
                  {channels?.map((channel) => (
                    <button
                      key={channel._id}
                      onClick={() => handleChannelClick(channel)}
                      className={`w-full p-3 rounded-lg mb-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                        selectedChat?._id === channel._id
                          ? isDark
                            ? "bg-gray-700"
                            : "bg-gray-100"
                          : ""
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            channel.isPrivate ? "bg-orange-500" : "bg-green-500"
                          } text-white font-semibold`}
                        >
                          {channel.isPrivate ? "🔒" : "#"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p
                              className={`font-medium truncate ${
                                isDark ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {channel.name}
                            </p>
                            {channel.unreadCount && channel.unreadCount > 0 ? (
                              <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                {channel.unreadCount}
                              </span>
                            ) : null}
                          </div>
                          <p
                            className={`text-sm truncate ${
                              isDark ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            {channel.memberCount || 0} members
                            {channel.description && ` • ${channel.description}`}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}

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
          className={`p-4 border-t ${
            isDark ? "border-gray-700" : "border-gray-200"
          }`}
        >
          {state.user ? (
            <div className="flex items-center space-x-3">
              <div className="relative">
                {state.user?.image ? (
                  <img
                    className="w-10 h-10 rounded-full"
                    src={state.user.image}
                    alt="Your avatar"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                    {getInitials(
                      state.user?.firstName || "",
                      state.user?.lastName || ""
                    )}
                  </div>
                )}
              </div>
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
            <div className={`${isDark ? "text-white" : "text-black"}`}>
              Loading user...
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
