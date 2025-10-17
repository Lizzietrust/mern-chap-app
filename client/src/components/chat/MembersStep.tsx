import React from "react";
import { UserItem } from "./UserItem";
import type { MembersStepProps } from "../../types/CreateChannelModal.types";

export const MembersStep: React.FC<MembersStepProps> = React.memo(
  ({
    // formData,
    availableUsers,
    selectedMembers,
    isCreating,
    onBack,
    onToggleMember,
    onCreateChannel,
    onClose,
    isDark,
  }) => {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Add Members ({selectedMembers.length} selected)
          </label>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {availableUsers.length === 0 ? (
              <div
                className={`text-center py-4 ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                No users available to add
              </div>
            ) : (
              availableUsers.map((user) => (
                <UserItem
                  key={user._id}
                  user={user}
                  isSelected={selectedMembers.includes(user._id)}
                  isDark={isDark}
                  onToggle={onToggleMember}
                />
              ))
            )}
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <button
            onClick={onBack}
            className={`px-4 py-2 rounded-lg border ${
              isDark
                ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Back
          </button>
          <div className="space-x-2">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg border ${
                isDark
                  ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              Cancel
            </button>
            <button
              onClick={onCreateChannel}
              disabled={isCreating || selectedMembers.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isCreating ? "Creating..." : "Create Channel"}
            </button>
          </div>
        </div>
      </div>
    );
  }
);

MembersStep.displayName = "MembersStep";
