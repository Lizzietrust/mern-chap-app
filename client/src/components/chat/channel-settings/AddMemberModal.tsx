import React, { useState } from "react";
import { Modal } from "../../modals/Modal";
import { useUsers } from "../../../hooks/useUsers";
import type { User } from "../../../types/types";

interface AddMemberModalProps {
  isOpen: boolean;
  isDark: boolean;
  onClose: () => void;
  onAddMember: (userId: string) => void;
  existingMembers: User[];
  isAdding: boolean;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  isDark,
  onClose,
  onAddMember,
  existingMembers,
  isAdding,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  const { data: usersData, isLoading } = useUsers(
    currentPage,
    limit,
    searchTerm
  );

  const availableUsers = usersData?.users?.filter(
    (user) => !existingMembers.some((member) => member._id === user._id)
  );

  const totalUsers = usersData?.totalUsers || 0;
  const totalPages = Math.ceil(totalUsers / limit);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  const handleNextPage = () => {
    if (hasNextPage) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (hasPrevPage) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleAddMember = (userId: string) => {
    onAddMember(userId);
  };

  return (
    <Modal
      isOpen={isOpen}
      isDark={isDark}
      onClose={onClose}
      title="Add Member"
      size="sm"
    >
      <div className="space-y-4">
        <div>
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={handleSearchChange}
            className={`w-full px-3 py-2 rounded-lg border ${
              isDark
                ? "bg-gray-700 border-gray-600 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
          />
        </div>

        <div className="max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-4">Loading users...</div>
          ) : availableUsers && availableUsers.length > 0 ? (
            <div className="space-y-2">
              {availableUsers.map((user) => (
                <div
                  key={user._id}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                  onClick={() => handleAddMember(user._id)}
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={user.image || "/default-avatar.png"}
                      alt={user.firstName}
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <p className="font-medium">
                        {user.firstName} {user.lastName}
                      </p>
                      <p
                        className={`text-sm ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {user.email}
                      </p>
                    </div>
                  </div>
                  {isAdding && (
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div
              className={`text-center py-4 ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              No users found
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {(hasPrevPage || hasNextPage) && (
          <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-600">
            <button
              onClick={handlePrevPage}
              disabled={!hasPrevPage || isLoading}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                hasPrevPage
                  ? isDark
                    ? "bg-gray-600 hover:bg-gray-500 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                  : isDark
                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              Previous
            </button>

            <span
              className={`text-sm ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={handleNextPage}
              disabled={!hasNextPage || isLoading}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                hasNextPage
                  ? isDark
                    ? "bg-gray-600 hover:bg-gray-500 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                  : isDark
                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};
