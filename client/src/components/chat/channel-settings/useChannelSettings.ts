import { useState } from "react";
import type { ChannelChat, User } from "../../../types/types";
import { useNotifications } from "../../../contexts";
import { useApp } from "../../../contexts/appcontext/index";
import {
  useChannelMembers,
  useUpdateChannel,
  useRemoveChannelMember,
  useUpdateChannelAdmin,
  useAddChannelMember,
} from "../../../hooks/channels";

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
  const [isUpdatingMembers, setIsUpdatingMembers] = useState(false);

  const { data: members } = useChannelMembers(channel._id);
  const updateChannelMutation = useUpdateChannel();
  const removeMemberMutation = useRemoveChannelMember();
  const updateAdminMutation = useUpdateChannelAdmin();
  const { success, error } = useNotifications();
  const { state } = useApp();

  const isCurrentUserAdmin = channel.admins.some((admin: string | User) => {
    if (typeof admin === "string") {
      return admin === state.user?._id;
    } else {
      return admin._id === state.user?._id;
    }
  });

  const addMemberMutation = useAddChannelMember();

  const handleUpdateChannel = async () => {
    if (!name?.trim()) {
      error("Channel name is required");
      return;
    }

    try {
      const updatedChannel = await updateChannelMutation.mutateAsync({
        channelId: channel._id,
        data: { name: name.trim(), description: description.trim(), isPrivate },
      });
      success("Channel updated successfully!");
      onUpdate();
      return updatedChannel;
    } catch {
      error("Failed to update channel");
      throw new Error("Failed to update channel");
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (userId === state.user?._id) {
      error("You cannot remove yourself from the channel");
      return;
    }

    if (!isCurrentUserAdmin) return;

    try {
      setIsUpdatingMembers(true);
      const updatedChannel = await removeMemberMutation.mutateAsync({
        channelId: channel._id,
        userId,
      });
      success("Member removed successfully!");
      onUpdate();
      return updatedChannel;
    } catch {
      error("Failed to remove member");
    } finally {
      setIsUpdatingMembers(false);
    }
  };

  const handleToggleAdmin = async (userId: string, isAdmin: boolean) => {
    if (!isCurrentUserAdmin) return;

    try {
      setIsUpdatingMembers(true);
      const updatedChannel = await updateAdminMutation.mutateAsync({
        channelId: channel._id,
        userId,
        isAdmin,
      });
      success(`User ${isAdmin ? "added as" : "removed from"} admin`);
      onUpdate();
      return updatedChannel;
    } catch {
      error("Failed to update admin status");
    } finally {
      setIsUpdatingMembers(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    if (!isCurrentUserAdmin) return;

    try {
      setIsUpdatingMembers(true);
      const updatedChannel = await addMemberMutation.mutateAsync({
        channelId: channel._id,
        userId,
      });
      success("Member added successfully!");
      onUpdate();
      return updatedChannel;
    } catch {
      error("Failed to add member");
      throw error;
    } finally {
      setIsUpdatingMembers(false);
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
    handleAddMember,
    isUpdatingMembers,
    resetForm,
  };
};
