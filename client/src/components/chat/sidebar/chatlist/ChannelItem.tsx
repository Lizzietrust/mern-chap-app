import React from "react";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import type { ChannelItemProps } from "../../../../types/Sidebar.types";

export const ChannelItem: React.FC<ChannelItemProps> = React.memo(
  ({
    channel,
    isSelected,
    hasUnread,
    unreadCount,
    lastMessageTime,
    displayText,
    onSelect,
    isDark,
    sidebarCollapsed,
    onShowSettings,
  }) => {
    const handleSettingsClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onShowSettings) {
        onShowSettings(channel);
      }
    };

    const handleChannelClick = () => {
      if (onSelect) {
        onSelect(channel);
      }
    };

    const getLastMessagePreview = () => {
      if (displayText) {
        return displayText;
      }

      if (!channel.lastMessage) {
        return "No messages yet";
      }

      if (typeof channel.lastMessage === "string") {
        return channel.lastMessage;
      }

      const lastMessage = channel.lastMessage as {
        isDeleted?: boolean;
        messageType?: string;
        fileName?: string;
        content?: string;
      };

      if (lastMessage.isDeleted) {
        return "This message was deleted";
      }

      if (lastMessage.messageType === "image") {
        return "📷 Photo";
      }

      if (lastMessage.messageType === "file") {
        return `📎 ${lastMessage.fileName || "File"}`;
      }

      return lastMessage.content || "Message";
    };

    const lastMessagePreview = getLastMessagePreview();

    if (sidebarCollapsed) {
      return (
        <button
          onClick={handleChannelClick}
          className={`w-full p-3 rounded-lg mb-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
            isSelected ? (isDark ? "bg-gray-700" : "bg-gray-100") : ""
          } ${hasUnread ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
          title={channel.name}
        >
          <div className="flex flex-col items-center space-y-2">
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                channel.isPrivate ? "bg-orange-500" : "bg-green-500"
              } text-white font-semibold text-lg`}
            >
              {channel.isPrivate ? "🔒" : "#"}
            </div>
            {unreadCount && unreadCount > 0 && (
              <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
        </button>
      );
    }

    return (
      <div
        onClick={handleChannelClick}
        className={`w-full p-3 rounded-lg mb-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
          isSelected ? (isDark ? "bg-gray-700" : "bg-gray-100") : ""
        } ${hasUnread ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleChannelClick();
          }
        }}
      >
        <div className="flex items-center space-x-3">
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              channel.isPrivate ? "bg-orange-500" : "bg-green-500"
            } text-white font-semibold text-lg`}
          >
            {channel.isPrivate ? "🔒" : "#"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <p
                  className={`font-medium truncate ${
                    isDark ? "text-white" : "text-gray-900"
                  } ${hasUnread ? "font-semibold" : ""}`}
                >
                  {channel.name}
                </p>

                {onShowSettings && (
                  <button
                    onClick={handleSettingsClick}
                    className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                    title="Channel Settings"
                  >
                    <Cog6ToothIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
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
                {unreadCount && unreadCount > 0 && (
                  <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
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
                {lastMessagePreview}
              </p>
            </div>
            {/* Member count */}
            <p
              className={`text-xs mt-1 ${
                isDark ? "text-gray-500" : "text-gray-400"
              }`}
            >
              {channel.members?.length || 0} members
            </p>
          </div>
        </div>
      </div>
    );
  }
);

ChannelItem.displayName = "ChannelItem";
