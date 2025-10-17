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
  }) => {
    return (
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
                onClick={() => onTabChange("dms")}
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
                onClick={() => onTabChange("channels")}
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
    );
  }
);

SidebarHeader.displayName = "SidebarHeader";
