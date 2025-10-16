import React from "react";
import type { ChannelChat } from "../../types";
import { useChannelSettings } from "../../hooks/useChannelSettings";
import { Modal } from "../modals/Modal";
import { Tabs } from "./Tabs";
import { SettingsTab } from "./channel-settings/SettingsTab";
import { MemberItem } from "./channel-settings/MemberItem";
import { useApp } from "../../contexts/AppContext";

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
