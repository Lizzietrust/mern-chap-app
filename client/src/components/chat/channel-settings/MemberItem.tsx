import React from "react";
import type { User } from "../../../types/types";
import { useNavigate } from "react-router-dom";

interface MemberItemProps {
  member: User & {
    isOnline?: boolean;
    lastSeen?: string;
  };
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
  const navigate = useNavigate();

  const handleToggleAdmin = () => {
    onToggleAdmin(member._id, !isAdmin);
  };

  const handleRemoveMember = () => {
    onRemoveMember(member._id);
  };

  const getMemberName = (member: User | string): string => {
    if (typeof member === "string") {
      return "Unknown User";
    }
    return `${member.firstName} ${member.lastName}`;
  };

  const formatLastSeen = (lastSeen?: string): string => {
    if (!lastSeen) return "a long time ago";

    try {
      const lastSeenDate = new Date(lastSeen);
      const now = new Date();
      const diffMs = now.getTime() - lastSeenDate.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "just now";
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24)
        return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

      return lastSeenDate.toLocaleDateString();
    } catch (error) {
      console.error("Error formatting last seen:", error);
      return "a long time ago";
    }
  };

  const displayIsOnline = isCurrentUser ? true : member.isOnline;

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
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium cursor-pointer relative ${
              isDark ? "bg-blue-600" : "bg-blue-500"
            }`}
            onClick={() =>
              !isCurrentUser
                ? navigate(`/profile/${member._id}`)
                : navigate(`/profile`)
            }
          >
            {member.image ? (
              <img
                src={member.image}
                alt={`${getMemberName(member)}'s avatar`}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div
                className={`w-full h-full flex items-center justify-center ${
                  isDark ? "bg-blue-600" : "bg-blue-500"
                } text-white font-semibold`}
              >
                {member.firstName && member.lastName
                  ? `${member.firstName[0]}${member.lastName[0]}`.toUpperCase()
                  : "UU"}
              </div>
            )}

            {/* Online status indicator */}
            <div
              className={`w-2 h-2 rounded-full absolute bottom-0 right-0 ${
                displayIsOnline ? "bg-green-500 animate-pulse" : "bg-gray-400"
              }`}
            />
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
            {!displayIsOnline && member.lastSeen && (
              <span className="ml-2 text-xs">
                • Last seen {formatLastSeen(member.lastSeen)}
              </span>
            )}
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
