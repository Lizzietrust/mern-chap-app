import React from "react";

interface SettingsTabProps {
  name?: string;
  description: string;
  isPrivate: boolean;
  isCurrentUserAdmin: boolean;
  isUpdating: boolean;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onPrivacyChange: (isPrivate: boolean) => void;
  onSave: () => void;
  isDark: boolean;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  name,
  description,
  isPrivate,
  isCurrentUserAdmin,
  isUpdating,
  onNameChange,
  onDescriptionChange,
  onPrivacyChange,
  onSave,
  isDark,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Channel Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          disabled={!isCurrentUserAdmin}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
            isDark
              ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
          } ${!isCurrentUserAdmin ? "opacity-50 cursor-not-allowed" : ""}`}
          placeholder="Enter channel name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          disabled={!isCurrentUserAdmin}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
            isDark
              ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
          } ${!isCurrentUserAdmin ? "opacity-50 cursor-not-allowed" : ""}`}
          rows={3}
          placeholder="Describe the purpose of this channel"
        />
      </div>

      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          id="isPrivate"
          checked={isPrivate}
          onChange={(e) => onPrivacyChange(e.target.checked)}
          disabled={!isCurrentUserAdmin}
          className="w-4 h-4 rounded focus:ring-blue-500 disabled:opacity-50"
        />
        <label htmlFor="isPrivate" className="text-sm font-medium">
          Private Channel
        </label>
        <span
          className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
        >
          {isPrivate
            ? "Only invited members can join"
            : "Anyone in the workspace can join"}
        </span>
      </div>

      {isCurrentUserAdmin && (
        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onSave}
            disabled={isUpdating || !name?.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isUpdating ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </div>
  );
};
