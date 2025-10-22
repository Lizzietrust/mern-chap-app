import React from "react";
import { PlusIcon } from "@heroicons/react/24/solid";
import type { SidebarHeaderProps } from "../../../types/Sidebar.types";

export const SidebarHeader: React.FC<SidebarHeaderProps> = React.memo(
  ({
    isDark,
    sidebarCollapsed,
    activeTab,
    onToggleSidebar,
    onTabChange,
    onNewChat,
    totalUnreadCount = 0,
    directUnreadCount = 0,
    channelUnreadCount = 0,
  }) => {
    return (
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <h2
                  className={`font-bold text-lg ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  Messages
                </h2>
                {/* Total unread count badge */}
                {totalUnreadCount > 0 && (
                  <span className="bg-blue-500 text-white text-[10px] rounded-full px-1 py-1 min-w-[20px] text-center">
                    {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
                  </span>
                )}
              </div>
              {activeTab === "direct" && (
                <button
                  onClick={onNewChat}
                  className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${
                    isDark ? "text-gray-300" : "text-gray-600"
                  }`}
                  title="New Chat"
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          )}

          {/* Unread count in collapsed mode */}
          {sidebarCollapsed && totalUnreadCount > 0 && (
            <span className="bg-blue-500 text-white text-[10px] rounded-full px-1 py-1 text-center">
              {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
            </span>
          )}

          <button
            onClick={onToggleSidebar}
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
                onClick={() => onTabChange("direct")}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors cursor-pointer relative ${
                  activeTab === "direct"
                    ? isDark
                      ? "bg-gray-600 text-white"
                      : "bg-white text-gray-900 shadow-sm"
                    : isDark
                    ? "text-gray-300 hover:text-white"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Direct Messages
                {/* Unread count for direct messages tab */}
                {directUnreadCount > 0 && (
                  <span className="absolute top-1 right-1 bg-blue-500 text-white text-[10px] rounded-full px-0.5 py-0.5 min-w-[18px] text-center">
                    {directUnreadCount > 99 ? "99+" : directUnreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => onTabChange("channels")}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors cursor-pointer relative ${
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
                {/* Unread count for channels tab */}
                {channelUnreadCount > 0 && (
                  <span className="absolute top-1 right-1 bg-blue-500 text-white text-[10px] rounded-full px-0.5 py-0.5 min-w-[18px] text-center">
                    {channelUnreadCount > 99 ? "99+" : channelUnreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

SidebarHeader.displayName = "SidebarHeader";
