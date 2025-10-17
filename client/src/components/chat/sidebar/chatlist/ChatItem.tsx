import React from "react";
import type { ChatItemProps } from "../../../../types/Sidebar.types";

export const ChatItem: React.FC<ChatItemProps> = React.memo(
  ({
    // chat,
    isSelected,
    hasUnread,
    unreadCount,
    displayName,
    lastMessage,
    lastMessageTime,
    isOnline,
    userImage,
    initials,
    onSelect,
    isDark,
    sidebarCollapsed,
  }) => {
    if (sidebarCollapsed) {
      return (
        <button
          onClick={onSelect}
          className={`w-full flex flex-col p-1 items-center justify-center rounded-lg mb-4 text-center hover:bg-gray-50 dark:hover:bg-gray-700 overflow-hidden transition-colors cursor-pointer ${
            isSelected ? (isDark ? "bg-gray-700" : "bg-gray-100") : ""
          } ${hasUnread ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
              {userImage ? (
                <img
                  className="w-10 h-10 rounded-full"
                  src={userImage}
                  alt="User avatar"
                />
              ) : (
                <div>{initials}</div>
              )}
            </div>
            {isOnline && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
            )}
          </div>
        </button>
      );
    }

    return (
      <button
        onClick={onSelect}
        className={`w-full p-3 rounded-lg mb-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 overflow-hidden transition-colors cursor-pointer ${
          isSelected ? (isDark ? "bg-gray-700" : "bg-gray-100") : ""
        } ${hasUnread ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
      >
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
              {userImage ? (
                <img
                  className="w-10 h-10 rounded-full"
                  src={userImage}
                  alt="User avatar"
                />
              ) : (
                <div>{initials}</div>
              )}
            </div>
            {isOnline && (
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
                {displayName}
              </p>
              <div className="flex items-center space-x-2">
                {lastMessageTime && (
                  <span
                    className={`text-xs whitespace-nowrap ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    } ${hasUnread ? "text-blue-500 dark:text-blue-400" : ""}`}
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
                {lastMessage}
              </p>
            </div>
          </div>
        </div>
      </button>
    );
  }
);

ChatItem.displayName = "ChatItem";
