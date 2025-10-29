import React from "react";
import type { ChannelChat } from "../../../types/types";
import { useChannelSettings } from "./useChannelSettings";
import { Modal } from "../../modals/Modal";
import { Tabs } from "../Tabs";
import { SettingsTab } from "./SettingsTab";
import { MemberItem } from "./MemberItem";
import { useApp } from "../../../contexts/appcontext/index";
import { useClearChat } from "../../../hooks/chats/useClearchat";

interface Props {
  isDark: boolean;
  channel: ChannelChat;
  onClose: () => void;
  onUpdate: () => void;
}

const ChannelSettingsModal: React.FC<Props> = ({
  isDark,
  channel,
  onClose,
  onUpdate,
}) => {
  const { state } = useApp();
  const {
    activeTab,
    setActiveTab,
    name,
    setName,
    description,
    setDescription,
    isPrivate,
    setIsPrivate,
    members,
    isCurrentUserAdmin,
    updateChannelMutation,
    handleUpdateChannel,
    handleRemoveMember,
    handleToggleAdmin,
  } = useChannelSettings(channel, onUpdate);

  const clearChatMutation = useClearChat();

  const handleClearChat = async (forEveryone: boolean) => {
    if (!channel) return;

    const confirmed = window.confirm(
      forEveryone
        ? "Clear all messages in this channel for everyone? This action cannot be undone."
        : "Clear chat history for yourself? Other members will still see the messages."
    );

    if (confirmed) {
      try {
        await clearChatMutation.mutateAsync({
          chatId: channel._id,
          deleteForEveryone: forEveryone,
        });
        onClose();
      } catch (error) {
        console.error("Failed to clear chat:", error);
      }
    }
  };

  const tabs = [
    { id: "settings" as const, label: "Settings" },
    { id: "members" as const, label: "Members", count: members?.length },
  ];

  return (
    <Modal isDark={isDark} onClose={onClose} title="Channel Settings" size="md">
      <Tabs<"settings" | "members">
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isDark={isDark}
      />

      {activeTab === "settings" && (
        <div className="space-y-4">
          <SettingsTab
            name={name}
            description={description}
            isPrivate={isPrivate}
            isCurrentUserAdmin={isCurrentUserAdmin}
            isUpdating={updateChannelMutation.isPending}
            onNameChange={setName}
            onDescriptionChange={setDescription}
            onPrivacyChange={setIsPrivate}
            onSave={handleUpdateChannel}
            isDark={isDark}
          />

          {/* Add Clear Chat section */}
          {isCurrentUserAdmin && (
            <div
              className={`border-t pt-4 ${
                isDark ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <h3
                className={`text-sm font-medium mb-3 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Danger Zone
              </h3>

              <div className="space-y-2">
                <button
                  onClick={() => handleClearChat(false)}
                  disabled={clearChatMutation.isPending}
                  className="w-full px-4 py-3 text-left text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-orange-200 dark:border-orange-800"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      <div>
                        <span className="font-medium">Clear Chat for Me</span>
                        <p
                          className={`text-sm ${
                            isDark ? "text-orange-400" : "text-orange-600"
                          }`}
                        >
                          Remove messages from your view only
                        </p>
                      </div>
                    </div>
                    {clearChatMutation.isPending && (
                      <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                    )}
                  </div>
                </button>

                <button
                  onClick={() => handleClearChat(true)}
                  disabled={clearChatMutation.isPending}
                  className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-red-200 dark:border-red-800"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      <div>
                        <span className="font-medium">
                          Clear Chat for Everyone
                        </span>
                        <p
                          className={`text-sm ${
                            isDark ? "text-red-400" : "text-red-600"
                          }`}
                        >
                          Permanently delete all messages for all members
                        </p>
                      </div>
                    </div>
                    {clearChatMutation.isPending && (
                      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                    )}
                  </div>
                </button>
              </div>

              <p
                className={`text-xs mt-2 ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                These actions cannot be undone.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === "members" && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {members?.map((member) => {
            const isAdmin = channel.admins.includes(member._id);
            const isCurrentUser = member._id === state.user?._id;

            return (
              <MemberItem
                key={member._id}
                member={member}
                isAdmin={isAdmin}
                isCurrentUser={isCurrentUser}
                isCurrentUserAdmin={isCurrentUserAdmin}
                onToggleAdmin={handleToggleAdmin}
                onRemoveMember={handleRemoveMember}
                isDark={isDark}
              />
            );
          })}

          {(!members || members.length === 0) && (
            <div
              className={`text-center py-8 rounded-lg ${
                isDark
                  ? "bg-gray-700 text-gray-400"
                  : "bg-gray-50 text-gray-500"
              }`}
            >
              No members found
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default ChannelSettingsModal;
