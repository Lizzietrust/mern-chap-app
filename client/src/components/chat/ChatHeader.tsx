import React, { useEffect, useState, useCallback, useMemo } from "react";
import type { ChatHeaderProps } from "../../types/chat-container.types";
import { useSocket } from "../../hooks/useSocket";
import { getUserId, type User } from "../../types/types";
import { useApp } from "../../contexts/appcontext/index";

const ChatHeader: React.FC<ChatHeaderProps> = React.memo(
  ({
    selectedChat,
    isDark,
    onBack,
    title,
    subtitle,
    onSearch,
    onMenu,
    onParticipants,
    onSettings,
  }) => {
    const { onlineUsers } = useSocket();
    const { state } = useApp();

    const safeOnlineUsers = useMemo(() => {
      return Array.isArray(onlineUsers) ? onlineUsers : [];
    }, [onlineUsers]);

    const isChannel = selectedChat?.type === "channel";
    const currentUserId = state.user?._id;

    const getUserStatus = useCallback(
      (
        user: User | string
      ): { isOnline: boolean; lastSeen?: Date; debug?: string } => {
        try {
          const userId = typeof user === "string" ? user : user?._id;

          if (!userId) {
            return { isOnline: false, debug: "No user ID" };
          }

          const onlineUser = safeOnlineUsers.find((u) => u._id === userId);
          if (onlineUser) {
            return {
              isOnline: onlineUser.isOnline || false,
              lastSeen: onlineUser.lastSeen,
              debug: `Found in onlineUsers: ${
                onlineUser.isOnline ? "online" : "offline"
              }`,
            };
          }

          if (typeof user !== "string" && user) {
            const status = {
              isOnline: user.isOnline || false,
              lastSeen: user.lastSeen,
              debug: `Using chat user data: ${
                user.isOnline ? "online" : "offline"
              }`,
            };
            return status;
          }

          return { isOnline: false, debug: "No data available" };
        } catch (error) {
          console.error("Error getting user status:", error);
          return {
            isOnline: false,
            debug: `Error: ${
              error instanceof Error ? error.message : String(error)
            }`,
          };
        }
      },
      [safeOnlineUsers]
    );

    const formatLastSeen = useCallback((lastSeen?: Date): string => {
      if (!lastSeen) return "a long time ago";

      try {
        const now = new Date();
        const diffMs = now.getTime() - new Date(lastSeen).getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return "just now";
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24)
          return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
        if (diffDays < 7)
          return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

        return new Date(lastSeen).toLocaleDateString();
      } catch (error) {
        console.log(error);

        return "a long time ago";
      }
    }, []);

    const getChannelMemberInfo = useCallback((): string => {
      if (!isChannel || !selectedChat?.members) return subtitle || "";

      try {
        const totalMembers = selectedChat.members.length;

        const onlineMembers = selectedChat.members.filter((member) => {
          try {
            const status = getUserStatus(member);
            return status.isOnline;
          } catch (error) {
            console.log(error);

            return false;
          }
        }).length;

        return `${totalMembers} member${
          totalMembers !== 1 ? "s" : ""
        } • ${onlineMembers} online`;
      } catch (error) {
        console.log(error);

        return subtitle || "";
      }
    }, [isChannel, selectedChat, subtitle, getUserStatus]);

    const getDirectChatStatus = useCallback((): {
      status: string;
      debug: string;
    } => {
      if (isChannel || !selectedChat?.participants) {
        return {
          status: subtitle || "",
          debug: "Not a direct chat or no participants",
        };
      }

      try {
        const otherParticipant = selectedChat.participants.find(
          (participant) => {
            try {
              const participantId = getUserId(participant);
              return participantId !== currentUserId;
            } catch (error) {
              console.log(error);

              return false;
            }
          }
        );

        if (!otherParticipant) {
          return {
            status: "User not found",
            debug: "No other participant found",
          };
        }

        const status = getUserStatus(otherParticipant);
        let statusText = "";

        if (status.isOnline) {
          statusText = "Online";
        } else if (status.lastSeen) {
          statusText = `Last seen ${formatLastSeen(status.lastSeen)}`;
        } else {
          statusText = "Offline";
        }

        return {
          status: statusText,
          debug: `User: ${getUserId(otherParticipant)}, ${status.debug}`,
        };
      } catch (error) {
        console.error("Error getting direct chat status:", error);
        return {
          status: subtitle || "",
          debug: `Error: ${
            error instanceof Error ? error.message : String(error)
          }`,
        };
      }
    }, [
      isChannel,
      selectedChat,
      subtitle,
      currentUserId,
      getUserStatus,
      formatLastSeen,
    ]);

    const [displaySubtitle, setDisplaySubtitle] = useState<string>(
      subtitle || ""
    );

    useEffect(() => {
      const calculateDisplaySubtitle = () => {
        try {
          if (isChannel) {
            const channelInfo = getChannelMemberInfo();
            setDisplaySubtitle(channelInfo);
          } else {
            const result = getDirectChatStatus();
            setDisplaySubtitle(result.status);
          }
        } catch (error) {
          setDisplaySubtitle(subtitle || "");
          console.log(error);
        }
      };

      calculateDisplaySubtitle();
    }, [isChannel, getChannelMemberInfo, getDirectChatStatus, subtitle]);

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
              className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 md:hidden ${
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
                  {!isChannel && selectedChat?.participants && (
                    <>
                      <div
                        className={`w-2 h-2 rounded-full ${
                          displaySubtitle.includes("Online")
                            ? "bg-green-500"
                            : "bg-gray-400"
                        }`}
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
          <div className="flex items-center space-x-1 md:space-x-2">
            <button
              onClick={onSearch}
              title="Search messages"
              className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${
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
            {onParticipants && (
              <button
                onClick={onParticipants}
                title="View participants"
                className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${
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
            <button
              onClick={onSettings}
              title="Chat settings"
              className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${
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
            <button
              onClick={onMenu}
              title="More options"
              className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${
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
          </div>
        </div>
      </div>
    );
  }
);

ChatHeader.displayName = "ChatHeader";

export default ChatHeader;
