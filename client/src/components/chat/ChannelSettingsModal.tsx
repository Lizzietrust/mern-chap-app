import { useState } from "react";
import type { ChannelChat } from "../../types";
import {
  useChannelMembers,
  useUpdateChannel,
  useRemoveChannelMember,
  useUpdateChannelAdmin,
} from "../../hooks/useChannels";
import { useNotifications } from "../../contexts/NotificationContext";
import { useApp } from "../../contexts/AppContext";

interface Props {
  isDark: boolean;
  channel: ChannelChat;
  onClose: () => void;
  onUpdate: () => void;
}

const ChannelSettingsModal = ({
  isDark,
  channel,
  onClose,
  onUpdate,
}: Props) => {
  const [activeTab, setActiveTab] = useState<"settings" | "members">(
    "settings"
  );
  const [name, setName] = useState(channel.name);
  const [description, setDescription] = useState(channel.description || "");
  const [isPrivate, setIsPrivate] = useState(channel.isPrivate);

  const { data: members } = useChannelMembers(channel._id);
  const updateChannelMutation = useUpdateChannel();
  const removeMemberMutation = useRemoveChannelMember();
  const updateAdminMutation = useUpdateChannelAdmin();
  const { success, error } = useNotifications();
  const { state } = useApp();

  const isCurrentUserAdmin = channel.admins.includes(state.user?._id || "");

  const handleUpdateChannel = async () => {
    try {
      await updateChannelMutation.mutateAsync({
        channelId: channel._id,
        data: { name, description, isPrivate },
      });
      success("Channel updated successfully!");
      onUpdate();
    } catch {
      error("Failed to update channel");
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await removeMemberMutation.mutateAsync({
        channelId: channel._id,
        userId,
      });
      success("Member removed successfully!");
    } catch {
      error("Failed to remove member");
    }
  };

  const handleToggleAdmin = async (userId: string, isAdmin: boolean) => {
    try {
      await updateAdminMutation.mutateAsync({
        channelId: channel._id,
        userId,
        isAdmin,
      });
      success(`User ${isAdmin ? "added as" : "removed from"} admin`);
    } catch {
      error("Failed to update admin status");
    }
  };

  return (
    <div
      className="fixed inset-0 bg-white/50 bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className={`rounded-lg w-full max-w-2xl mx-4 ${
          isDark ? "bg-gray-800 text-white" : "bg-white text-gray-900"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Channel Settings</h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b mb-4">
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab("settings")}
                className={`pb-2 px-1 ${
                  activeTab === "settings"
                    ? "border-b-2 border-blue-500 text-blue-500"
                    : isDark
                    ? "text-gray-400"
                    : "text-gray-500"
                }`}
              >
                Settings
              </button>
              <button
                onClick={() => setActiveTab("members")}
                className={`pb-2 px-1 ${
                  activeTab === "members"
                    ? "border-b-2 border-blue-500 text-blue-500"
                    : isDark
                    ? "text-gray-400"
                    : "text-gray-500"
                }`}
              >
                Members ({members?.length || 0})
              </button>
            </div>
          </div>

          {activeTab === "settings" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Channel Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isCurrentUserAdmin}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  } ${
                    !isCurrentUserAdmin ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={!isCurrentUserAdmin}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  } ${
                    !isCurrentUserAdmin ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  disabled={!isCurrentUserAdmin}
                  className="rounded focus:ring-blue-500 disabled:opacity-50"
                />
                <label htmlFor="isPrivate" className="text-sm">
                  Private Channel
                </label>
              </div>

              {isCurrentUserAdmin && (
                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleUpdateChannel}
                    disabled={updateChannelMutation.isPending || !name?.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {updateChannelMutation.isPending
                      ? "Saving..."
                      : "Save Changes"}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === "members" && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {members?.map((member) => {
                const isAdmin = channel.admins.includes(member._id);
                const isCurrentUser = member._id === state.user?._id;

                return (
                  <div
                    key={member._id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      isDark ? "bg-gray-700" : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                        {member.firstName?.charAt(0) || "U"}
                      </div>
                      <div>
                        <p className="font-medium">
                          {member.firstName} {member.lastName}
                          {isAdmin && (
                            <span
                              className={`ml-2 text-xs px-2 py-1 rounded ${
                                isDark
                                  ? "bg-yellow-900 text-yellow-200"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              Admin
                            </span>
                          )}
                        </p>
                        <p
                          className={`text-sm ${
                            isDark ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          {member.email}
                        </p>
                      </div>
                    </div>

                    {isCurrentUserAdmin && !isCurrentUser && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            handleToggleAdmin(member._id, !isAdmin)
                          }
                          className={`px-3 py-1 rounded text-sm ${
                            isAdmin
                              ? isDark
                                ? "bg-gray-600 text-gray-300"
                                : "bg-gray-200 text-gray-700"
                              : isDark
                              ? "bg-yellow-600 text-white"
                              : "bg-yellow-500 text-white"
                          }`}
                        >
                          {isAdmin ? "Remove Admin" : "Make Admin"}
                        </button>
                        <button
                          onClick={() => handleRemoveMember(member._id)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChannelSettingsModal;
