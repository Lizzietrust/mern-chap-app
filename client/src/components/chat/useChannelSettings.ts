import { useState } from "react";
import type { ChannelChat } from "../../types/types";
import { useNotifications } from "../../contexts/NotificationContext";
import { useApp } from "../../contexts/AppContext";
import {
  useChannelMembers,
  useUpdateChannel,
  useRemoveChannelMember,
  useUpdateChannelAdmin,
} from "../../hooks/useChannels";

export const useChannelSettings = (
  channel: ChannelChat,
  onUpdate: () => void
) => {
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
    if (!name?.trim()) {
      error("Channel name is required");
      return;
    }

    try {
      await updateChannelMutation.mutateAsync({
        channelId: channel._id,
        data: { name: name.trim(), description: description.trim(), isPrivate },
      });
      success("Channel updated successfully!");
      onUpdate();
    } catch {
      error("Failed to update channel");
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (userId === state.user?._id) {
      error("You cannot remove yourself from the channel");
      return;
    }

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

  const resetForm = () => {
    setName(channel.name);
    setDescription(channel.description || "");
    setIsPrivate(channel.isPrivate);
  };

  return {
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
    removeMemberMutation,
    updateAdminMutation,
    handleUpdateChannel,
    handleRemoveMember,
    handleToggleAdmin,
    resetForm,
  };
};
