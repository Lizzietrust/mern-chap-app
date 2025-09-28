import { XMarkIcon } from "@heroicons/react/24/solid";
import React from "react";
import type { User } from "../../types";

interface Props {
  isDark: boolean;
  onClose: () => void;
  users: User[];
  handleSelectUser: (userId: string) => void;
}

const NewChatModal = ({ isDark, onClose, users, handleSelectUser }: Props) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className={`${
          isDark ? "bg-gray-800" : "bg-white"
        } rounded-lg p-8 w-full max-w-md`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2
            className={`text-xl font-bold ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            New Chat
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${
              isDark ? "text-gray-300" : "text-gray-600"
            }`}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {users.map((user) => (
            <button
              key={user._id}
              onClick={() => handleSelectUser(user._id)}
              className={`w-full p-3 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                  {user.image ? (
                    <img
                      className="w-10 h-10 rounded-full"
                      src={user.image}
                      alt="User avatar"
                    />
                  ) : (
                    <div>
                      {user.firstName?.charAt(0) || "U"}
                    </div>
                  )}
                </div>
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
            </button>
          ))}
        </div>

        {users.length === 0 && (
          <p
            className={`text-center py-4 ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            No users found
          </p>
        )}
      </div>
    </div>
  );
};

export default NewChatModal;