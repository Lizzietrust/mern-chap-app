import React from "react";
import type { User } from "../../types/types";

interface UserItemProps {
  user: User;
  isSelected: boolean;
  isDark: boolean;
  onToggle: (userId: string) => void;
}

export const UserItem: React.FC<UserItemProps> = React.memo(
  ({ user, isSelected, isDark, onToggle }) => {
    const displayName =
      user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.name || user.email;

    const initials = user.firstName?.charAt(0) || user.name?.charAt(0) || "U";

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
        onClick={() => onToggle(user._id)}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => {}}
          className="rounded focus:ring-blue-500"
        />
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm">
          {initials}
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
