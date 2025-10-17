import React from "react";
import type { User } from "../../../types/types";

export interface UserItemProps {
  user: User;
  isSelected?: boolean;
  isDark: boolean;
  onToggle?: (userId: string) => void;
  onSelect?: (userId: string) => void;
  showCheckbox?: boolean;
  variant?: "select" | "toggle";
}

export const UserItem: React.FC<UserItemProps> = React.memo(
  ({
    user,
    isSelected = false,
    isDark,
    onToggle,
    onSelect,
    showCheckbox = false,
    variant = "toggle",
  }) => {
    const displayName =
      user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.name || user.email;

    const initials = user.firstName?.charAt(0) || user.name?.charAt(0) || "U";

    const handleClick = () => {
      if (variant === "select" && onSelect) {
        onSelect(user._id);
      } else if (variant === "toggle" && onToggle) {
        onToggle(user._id);
      }
    };

    return (
      <div
        className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer ${
          isSelected
            ? isDark
              ? "bg-blue-900"
              : "bg-blue-100"
            : isDark
            ? "hover:bg-gray-700"
            : "hover:bg-gray-50"
        }`}
        onClick={handleClick}
      >
        {showCheckbox && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => {}}
            className="rounded focus:ring-blue-500"
          />
        )}
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm flex-shrink-0">
          {user.image ? (
            <img
              src={user.image}
              alt={displayName}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            initials
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{displayName}</p>
          <p
            className={`text-sm truncate ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {user.email}
          </p>
        </div>
      </div>
    );
  }
);

UserItem.displayName = "UserItem";
