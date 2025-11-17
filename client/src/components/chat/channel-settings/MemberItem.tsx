import React from "react";
import type { User } from "../../../types/types";
import { getInitials } from "../../../functions";

interface MemberItemProps {
  member: User;
  isAdmin: boolean;
  isCurrentUser: boolean;
  isCurrentUserAdmin: boolean;
  onToggleAdmin: (memberId: string, isAdmin: boolean) => void;
  onRemoveMember: (memberId: string) => void;
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
  const handleToggleAdmin = () => {
    onToggleAdmin(member._id, !isAdmin);
  };

  const handleRemoveMember = () => {
    onRemoveMember(member._id);
  };

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg ${
        isDark ? "bg-gray-700 hover:bg-gray-600" : "bg-white hover:bg-gray-50"
      } transition-colors border ${
        isDark ? "border-gray-600" : "border-gray-200"
      }`}
    >
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
              isDark ? "bg-blue-600" : "bg-blue-500"
            }`}
          >
            {getInitials(member.firstName || "", member.lastName || "")}
          </div>
        </div>
        <div>
          <div
            className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}
          >
            {member.firstName} {member.lastName}
            {isCurrentUser && (
              <span
                className={`ml-2 text-xs ${
                  isDark ? "text-blue-400" : "text-blue-600"
                }`}
              >
                (You)
              </span>
            )}
            {isAdmin && (
              <span
                className={`ml-2 text-xs ${
                  isDark ? "text-yellow-400" : "text-yellow-600"
                }`}
              >
                Admin
              </span>
            )}
          </div>
          <div
            className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
          >
            {member.email}
          </div>
        </div>
      </div>

      {isCurrentUserAdmin && !isCurrentUser && (
        <div className="flex items-center space-x-2">
          <button
            onClick={handleToggleAdmin}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              isAdmin
                ? isDark
                  ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                  : "bg-yellow-500 hover:bg-yellow-600 text-white"
                : isDark
                ? "bg-gray-600 hover:bg-gray-500 text-white"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
            }`}
          >
            {isAdmin ? "Remove Admin" : "Make Admin"}
          </button>
          <button
            onClick={handleRemoveMember}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              isDark
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-red-500 hover:bg-red-600 text-white"
            }`}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
};
