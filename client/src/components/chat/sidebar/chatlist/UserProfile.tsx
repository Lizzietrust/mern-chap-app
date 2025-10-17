import React from "react";
import { getInitials } from "../../../../functions";
import type { UserProfileProps } from "../../../../types/Sidebar.types";

export const UserProfile: React.FC<UserProfileProps> = React.memo(
  ({ user, sidebarCollapsed, isDark }) => {
    if (!user) {
      return (
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
      );
    }

    return (
      <div
        className={`flex items-center ${
          sidebarCollapsed ? "justify-center" : "space-x-3"
        }`}
      >
        <div className="relative">
          {user.image ? (
            <img
              className="w-10 h-10 rounded-full object-cover cursor-pointer"
              src={user.image}
              alt="Your avatar"
              title={
                sidebarCollapsed ? `${user.firstName} ${user.lastName}` : ""
              }
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold cursor-pointer"
              title={
                sidebarCollapsed ? `${user.firstName} ${user.lastName}` : ""
              }
            >
              {getInitials(user.firstName || "", user.lastName || "")}
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
              {user.firstName} {user.lastName}
            </p>
            <p
              className={`text-sm truncate ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {user.email}
            </p>
          </div>
        )}
      </div>
    );
  }
);

UserProfile.displayName = "UserProfile";
