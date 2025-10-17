import React from "react";
import { UserItem } from "../../shared/user-item";
import type { UserListProps } from "../../../types/NewChatModal.types";

export const UserList: React.FC<UserListProps> = React.memo(
  ({ users, isLoading, searchTerm, onUserSelect, isDark }) => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (users.length === 0) {
      return (
        <p
          className={`text-center py-8 ${
            isDark ? "text-gray-400" : "text-gray-500"
          }`}
        >
          {searchTerm
            ? "No users found matching your search"
            : "No users found"}
        </p>
      );
    }

    return (
      <div className="overflow-y-auto space-y-2 min-h-0 h-[calc(90vh-250px)]">
        {users.map((user) => (
          <UserItem
            key={user._id}
            user={user}
            onSelect={onUserSelect}
            isDark={isDark}
            variant="select"
            showCheckbox={false}
          />
        ))}
      </div>
    );
  }
);

UserList.displayName = "UserList";
