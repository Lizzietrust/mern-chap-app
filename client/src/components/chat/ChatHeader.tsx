import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import type { ChatHeaderProps } from "../../types/chat-container.types";
import { useSocket } from "../../hooks/useSocket";
import {
  getUserId,
  type User,
  type UserChat,
  isDirectChat,
} from "../../types/types";
import { useApp } from "../../contexts/appcontext/index";
import { useCallContext } from "../../hooks/useCallContext";
import { MdOutlineNotificationsNone } from "react-icons/md";
import { useNavigate } from "react-router-dom";

const ChatHeader: React.FC<ChatHeaderProps> = React.memo(
  ({
    selectedChat,
    isDark,
    onBack,
    title,
    image,
    subtitle,
    onSearch,
    onParticipants,
    onSettings,
  }) => {
    const { onlineUsers, isConnected } = useSocket();
    const { state } = useApp();
    const { startCall } = useCallContext();
    const navigate = useNavigate();

    const onlineUsersRef = useRef(onlineUsers);
    const isConnectedRef = useRef(isConnected);

    useEffect(() => {
      onlineUsersRef.current = onlineUsers;
    }, [onlineUsers]);

    useEffect(() => {
      isConnectedRef.current = isConnected;
    }, [isConnected]);

    const safeOnlineUsers = useMemo(() => {
      console.log("📊 Online users in ChatHeader:", onlineUsers);
      return Array.isArray(onlineUsers) ? onlineUsers : [];
    }, [onlineUsers]);

    const isChannel = selectedChat?.type === "channel";
    const currentUserId = state.user?._id;

    const otherParticipant = useMemo(() => {
      if (isChannel || !selectedChat || !isDirectChat(selectedChat))
        return null;

      const directChat = selectedChat as UserChat;
      if (!directChat.participants) return null;

      try {
        const participant = directChat.participants.find((participant) => {
          const participantId = getUserId(participant);
          return participantId !== currentUserId;
        });

        if (!participant) return null;

        const userParticipant =
          typeof participant === "string"
            ? ({ _id: participant } as Partial<User>)
            : participant;

        return userParticipant as User | null;
      } catch (error) {
        console.error("Error finding other participant:", error);
        return null;
      }
    }, [isChannel, selectedChat, currentUserId]);

    const getUserStatus = useCallback(
      (
        user: User | string | null
      ): { isOnline: boolean; lastSeen?: Date; userObject?: User } => {
        try {
          if (!user) {
            return { isOnline: false };
          }

          const userId = typeof user === "string" ? user : user?._id;

          if (!userId) {
            return { isOnline: false };
          }

          console.log(
            `👥 Total online users: ${onlineUsersRef.current.length}`
          );

          const currentOnlineUsers = onlineUsersRef.current;

          const onlineUser = currentOnlineUsers.find((u) => u._id === userId);
          if (onlineUser) {
            return {
              isOnline: onlineUser.isOnline || false,
              lastSeen: onlineUser.lastSeen,
              userObject: onlineUser,
            };
          }

          if (typeof user !== "string") {
            console.log(
              `ℹ️ Using user object data for ${userId}:`,
              user.isOnline
            );
            return {
              isOnline: user.isOnline || false,
              lastSeen: user.lastSeen,
              userObject: user,
            };
          }

          console.log(`❌ No status data found for user: ${userId}`);
          return { isOnline: false };
        } catch (error) {
          console.error("Error getting user status:", error);
          return { isOnline: false };
        }
      },
      []
    );

    const formatLastSeen = useCallback((lastSeen?: Date): string => {
      if (!lastSeen) return "a long time ago";

      try {
        const now = new Date();
        const lastSeenDate = new Date(lastSeen);
        const diffMs = now.getTime() - lastSeenDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return "just now";
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24)
          return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
        if (diffDays < 7)
          return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

        return lastSeenDate.toLocaleDateString();
      } catch (error) {
        console.error("Error formatting last seen:", error);
        return "a long time ago";
      }
    }, []);

    const getChannelMemberInfo = useCallback((): string => {
      if (!isChannel || !selectedChat?.members) return subtitle || "";

      try {
        const totalMembers = selectedChat.members.length;
        const onlineMembers = selectedChat.members.filter((member) => {
          const status = getUserStatus(member);
          return status.isOnline;
        }).length;

        return `${totalMembers} member${
          totalMembers !== 1 ? "s" : ""
        } • ${onlineMembers} online`;
      } catch (error) {
        console.error("Error getting channel member info:", error);
        return subtitle || "";
      }
    }, [isChannel, selectedChat, subtitle, getUserStatus]);

    const getDirectChatStatus = useCallback((): string => {
      if (isChannel || !otherParticipant) {
        return subtitle || "";
      }

      try {
        const status = getUserStatus(otherParticipant);

        if (status.isOnline) {
          return "Online";
        } else if (status.lastSeen) {
          return `Last seen ${formatLastSeen(status.lastSeen)}`;
        } else {
          return "Offline";
        }
      } catch (error) {
        console.error("Error getting direct chat status:", error);
        return subtitle || "";
      }
    }, [isChannel, otherParticipant, subtitle, getUserStatus, formatLastSeen]);

    const [displaySubtitle, setDisplaySubtitle] = useState<string>(
      subtitle || ""
    );
    const [isOnline, setIsOnline] = useState<boolean>(false);
    const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);

    const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const updateStatus = useCallback(() => {
      try {
        if (isChannel) {
          const channelInfo = getChannelMemberInfo();
          setDisplaySubtitle(channelInfo);
          setIsOnline(false);
        } else {
          const statusText = getDirectChatStatus();
          setDisplaySubtitle(statusText);

          if (otherParticipant) {
            const status = getUserStatus(otherParticipant);
            setIsOnline(status.isOnline);
          } else {
            setIsOnline(false);
          }
        }
      } catch (error) {
        console.error("Error updating status:", error);
        setDisplaySubtitle(subtitle || "");
        setIsOnline(false);
      }
    }, [
      isChannel,
      getChannelMemberInfo,
      getDirectChatStatus,
      subtitle,
      otherParticipant,
      getUserStatus,
    ]);

    useEffect(() => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      updateTimeoutRef.current = setTimeout(() => {
        updateStatus();
      }, 100);

      return () => {
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }
      };
    }, [updateStatus, safeOnlineUsers, isConnected]);

    useEffect(() => {
      if (isConnected && state.socket) {
        state.socket.emit("getOnlineUsers");
      }
    }, [isConnected, state.socket]);

    useEffect(() => {
      if (otherParticipant && !isChannel) {
        const status = getUserStatus(otherParticipant);
        console.log(`🔍 Current status for ${otherParticipant._id}:`, {
          isOnline: status.isOnline,
          lastSeen: status.lastSeen,
          foundInOnlineUsers: safeOnlineUsers.some(
            (u) => u._id === otherParticipant._id
          ),
        });
      }
    }, [safeOnlineUsers, otherParticipant, isChannel, getUserStatus]);

    useEffect(() => {
      if (otherParticipant) {
        console.log(`👤 Participant changed to:`, otherParticipant._id);
        updateStatus();
      }
    }, [otherParticipant, updateStatus]);

    const handleAudioCall = () => {
      if (otherParticipant) {
        startCall(otherParticipant, "audio");
      }
    };

    const handleVideoCall = () => {
      if (otherParticipant) {
        startCall(otherParticipant, "video");
      }
    };

    const handleMobileMenuClick = () => {
      setShowMobileMenu(!showMobileMenu);
    };

    const handleMobileAction = (action: () => void) => {
      action();
      setShowMobileMenu(false);
    };

    const renderDesktopActions = () => (
      <div className="hidden md:flex items-center space-x-2">
        {/* Search Button */}
        {onSearch && (
          <button
            onClick={onSearch}
            title="Search messages"
            className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
              isDark ? "text-gray-300" : "text-gray-600"
            }`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
        )}

        {/* Notification Button */}
        <button
          onClick={() => {
            /* Add notification handler */
          }}
          title="Notifications"
          className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
            isDark ? "text-gray-300" : "text-gray-600"
          }`}
        >
          <MdOutlineNotificationsNone className="w-6 h-6" />
        </button>

        {/* Call Buttons - Only for direct chats */}
        {!isChannel && otherParticipant && (
          <>
            {/* Audio Call Button */}
            <button
              onClick={handleAudioCall}
              title="Audio Call"
              className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
            </button>

            {/* Video Call Button */}
            <button
              onClick={handleVideoCall}
              title="Video Call"
              className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>
          </>
        )}

        {/* Settings Button */}
        {onSettings && (
          <button
            onClick={onSettings}
            title="Chat settings"
            className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
              isDark ? "text-gray-300" : "text-gray-600"
            }`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        )}

        {/* Participants Button - Only for channels */}
        {isChannel && onParticipants && (
          <button
            onClick={onParticipants}
            title="View participants"
            className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
              isDark ? "text-gray-300" : "text-gray-600"
            }`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
              />
            </svg>
          </button>
        )}
      </div>
    );

    const renderMobileActions = () => (
      <div className="md:hidden relative">
        {/* Mobile Menu Button */}
        <button
          onClick={handleMobileMenuClick}
          title="More options"
          className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
            isDark ? "text-gray-300" : "text-gray-600"
          }`}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
            />
          </svg>
        </button>

        {/* Mobile Dropdown Menu */}
        {showMobileMenu && (
          <div
            className={`absolute right-0 top-12 w-48 rounded-lg shadow-lg py-2 z-50 ${
              isDark
                ? "bg-gray-800 border border-gray-700"
                : "bg-white border border-gray-200"
            }`}
          >
            {/* Search Option */}
            {onSearch && (
              <button
                onClick={() => handleMobileAction(onSearch)}
                className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <span>Search Messages</span>
                </div>
              </button>
            )}

            {/* Notification Option */}
            <button
              onClick={() => handleMobileAction(() => {})}
              className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              <div className="flex items-center space-x-3">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-5 5v-5zM10.24 8.56a5.97 5.97 0 01-4.66-7.4 1 1 0 00-.68-1.23A12.76 12.76 0 003 2.96a1 1 0 00-.3 1.66 5.97 5.97 0 014.66 7.4 1 1 0 00.68 1.23 12.76 12.76 0 002.9.37 1 1 0 00.9-1.06z"
                  />
                </svg>
                <span>Notifications</span>
              </div>
            </button>

            {/* Call Options - Only for direct chats */}
            {!isChannel && otherParticipant && (
              <>
                <button
                  onClick={() => handleMobileAction(handleAudioCall)}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <span>Audio Call</span>
                  </div>
                </button>

                <button
                  onClick={() => handleMobileAction(handleVideoCall)}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    <span>Video Call</span>
                  </div>
                </button>
              </>
            )}

            {/* Settings Option */}
            {onSettings && (
              <button
                onClick={() => handleMobileAction(onSettings)}
                className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                  </svg>
                  <span>Settings</span>
                </div>
              </button>
            )}

            {/* Participants Option - Only for channels */}
            {isChannel && onParticipants && (
              <button
                onClick={() => handleMobileAction(onParticipants)}
                className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                    />
                  </svg>
                  <span>Participants</span>
                </div>
              </button>
            )}
          </div>
        )}
      </div>
    );

    return (
      <div
        className={`border-b px-4 md:px-6 py-4 ${
          isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 md:hidden transition-colors ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
              aria-label="Back to conversations"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <div className="flex items-center space-x-3">
              {isChannel && (
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    selectedChat.isPrivate ? "bg-orange-500" : "bg-green-500"
                  } text-white font-semibold`}
                >
                  {selectedChat.isPrivate ? "🔒" : "#"}
                </div>
              )}
              <div
                className="flex items-center space-x-3 cursor-pointer"
                onClick={() => navigate(`/profile/${otherParticipant?._id}`)}
              >
                <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
                  <img
                    src={image}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex flex-col">
                  <h1
                    className={`text-lg md:text-xl font-bold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {title}
                  </h1>
                  <div className="flex items-center space-x-2">
                    {/* Online status indicator for direct chats */}
                    {!isChannel && otherParticipant && (
                      <>
                        <div
                          className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                            isOnline
                              ? "bg-green-500 animate-pulse"
                              : "bg-gray-400"
                          }`}
                          title={isOnline ? "Online" : "Offline"}
                        />
                        <p
                          className={`text-sm ${
                            isDark ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          {displaySubtitle}
                        </p>
                      </>
                    )}

                    {/* Channel member info */}
                    {isChannel && (
                      <p
                        className={`text-sm ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {displaySubtitle}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1">
            {renderDesktopActions()}
            {renderMobileActions()}
          </div>
        </div>
      </div>
    );
  }
);

ChatHeader.displayName = "ChatHeader";

export default ChatHeader;
