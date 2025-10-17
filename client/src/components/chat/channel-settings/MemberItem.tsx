import React from "react";
import type { User } from "../../../types/types";

interface MemberItemProps {
  member: User;
  isAdmin: boolean;
  isCurrentUser: boolean;
  isCurrentUserAdmin: boolean;
  onToggleAdmin: (userId: string, isAdmin: boolean) => void;
  onRemoveMember: (userId: string) => void;
  isDark: boolean;
}

export const MemberItem: React.FC<MemberItemProps> = ({
  member,
  isAdmin,
  isCurrentUser,
  isCurrentUserAdmin,
  onToggleAdmin,
  onRemoveMember,
  isDark,
}) => {
  const getInitials = (firstName?: string, lastName?: string) => {
    return (
      `${firstName?.charAt(0) || ""}${
        lastName?.charAt(0) || ""
      }`.toUpperCase() || "U"
    );
  };

  return (
    <div
      className={`flex items-center justify-between p-4 rounded-lg ${
        isDark ? "bg-gray-700" : "bg-gray-50"
      }`}
    >
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
          {getInitials(member.firstName, member.lastName)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <p className="font-medium truncate">
              {member.firstName} {member.lastName}
            </p>
            {isAdmin && (
              <span
                className={`text-xs px-2 py-1 rounded flex-shrink-0 ${
                  isDark
                    ? "bg-yellow-900 text-yellow-200"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                Admin
              </span>
            )}
          </div>
          <p
            className={`text-sm truncate ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {member.email}
          </p>
        </div>
      </div>

      {isCurrentUserAdmin && !isCurrentUser && (
        <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
          <button
            onClick={() => onToggleAdmin(member._id, !isAdmin)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              isAdmin
                ? isDark
                  ? "bg-gray-600 text-gray-300 hover:bg-gray-500"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                : isDark
                ? "bg-yellow-600 text-white hover:bg-yellow-500"
                : "bg-yellow-500 text-white hover:bg-yellow-400"
            }`}
          >
            {isAdmin ? "Remove Admin" : "Make Admin"}
          </button>
          <button
            onClick={() => onRemoveMember(member._id)}
            className="px-3 py-1 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
};
