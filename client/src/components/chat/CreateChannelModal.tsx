import { useState } from "react";
import { useUsers } from "../../hooks/useUsers";
import { useCreateChannel } from "../../hooks/useChannels";
import { useNotifications } from "../../contexts/NotificationContext";
import { useApp } from "../../contexts/AppContext";
import type { ChannelChat } from "../../types";

interface Props {
  isDark: boolean;
  onClose: () => void;
  onChannelCreated: (channel: ChannelChat) => void;
}

const CreateChannelModal = ({ isDark, onClose, onChannelCreated }: Props) => {
  const [step, setStep] = useState<"details" | "members">("details");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const { data: usersData } = useUsers(1, 20, "");
  const { success, error } = useNotifications();
  const { mutate: createChannel, isPending } = useCreateChannel();
  const { state } = useApp();

  const handleCreateChannel = async () => {
    try {
      if (!name.trim()) {
        error("Channel name is required");
        return;
      }

      if (selectedMembers.length === 0) {
        error("Please select at least one member");
        return;
      }

      const channelData = {
        name: name.trim(),
        description: description.trim(),
        isPrivate,
        memberIds: selectedMembers,
      };

      createChannel(channelData, {
        onSuccess: (newChannel) => {
          success("Channel created successfully!");
          onChannelCreated(newChannel);
          onClose();
        },
        onError: (err) => {
          console.error("Failed to create channel:", err);
          error("Failed to create channel. Please try again.");
        },
      });
    } catch (err) {
      console.error("Failed to create channel:", err);
      error("Failed to create channel. Please try again.");
    }
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const availableUsers =
    usersData?.users?.filter((user) => user._id !== state.user?._id) || [];

  return (
    <div
      className="fixed inset-0 bg-white/50 bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className={`rounded-lg w-full max-w-md mx-4 ${
          isDark ? "bg-gray-800 text-white" : "bg-white text-gray-900"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Create Channel</h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              ✕
            </button>
          </div>

          {step === "details" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Channel Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                  placeholder="Enter channel name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                  placeholder="Enter channel description (optional)"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="rounded focus:ring-blue-500"
                />
                <label htmlFor="isPrivate" className="text-sm">
                  Private Channel
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
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
                  onClick={() => setStep("members")}
                  disabled={!name.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {step === "members" && (
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
                      <div
                        key={user._id}
                        className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer ${
                          selectedMembers.includes(user._id)
                            ? isDark
                              ? "bg-blue-900"
                              : "bg-blue-100"
                            : isDark
                            ? "hover:bg-gray-700"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => toggleMember(user._id)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(user._id)}
                          onChange={() => {}}
                          className="rounded focus:ring-blue-500"
                        />
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm">
                          {user.firstName?.charAt(0) ||
                            user.name?.charAt(0) ||
                            "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {user.firstName && user.lastName
                              ? `${user.firstName} ${user.lastName}`
                              : user.name || user.email}
                          </p>
                          <p
                            className={`text-sm truncate ${
                              isDark ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            {user.email}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setStep("details")}
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
                    onClick={handleCreateChannel}
                    disabled={isPending || selectedMembers.length === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isPending ? "Creating..." : "Create Channel"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateChannelModal;
