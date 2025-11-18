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

interface ApiError extends Error {
  response?: {
    data?: {
      message?: string;
    };
  };
}

const isErrorWithMessage = (error: unknown): error is { message: string } => {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  );
};

const isApiError = (error: unknown): error is ApiError => {
  return (
    isErrorWithMessage(error) &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response
  );
};

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
  const { success, error: showError } = useNotifications();
  const { state } = useApp();

  const isCurrentUserAdmin = channel.admins.some((admin: string | User) => {
    if (typeof admin === "string") {
      return admin === state.user?._id;
    } else {
      return admin._id === state.user?._id;
    }
  });

  const addMemberMutation = useAddChannelMember();

  const extractErrorMessage = (error: unknown): string => {
    if (isApiError(error)) {
      return (
        error.response?.data?.message ||
        error.message ||
        "An unexpected error occurred"
      );
    }

    if (isErrorWithMessage(error)) {
      return error.message;
    }

    if (typeof error === "string") {
      return error;
    }

    return "An unexpected error occurred";
  };

  const handleUpdateChannel = async (): Promise<ChannelChat | void> => {
    if (!name?.trim()) {
      showError("Channel name is required");
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
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err);
      showError(errorMessage);
    }
  };

  const handleRemoveMember = async (
    userId: string
  ): Promise<ChannelChat | void> => {
    if (userId === state.user?._id) {
      showError("You cannot remove yourself from the channel");
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
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err);
      showError(errorMessage);
    } finally {
      setIsUpdatingMembers(false);
    }
  };

  const handleToggleAdmin = async (
    userId: string,
    isAdmin: boolean
  ): Promise<ChannelChat | void> => {
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
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err);
      showError(errorMessage);
    } finally {
      setIsUpdatingMembers(false);
    }
  };

  const handleAddMember = async (
    userId: string
  ): Promise<ChannelChat | void> => {
    if (!isCurrentUserAdmin) {
      showError("You don't have permission to add members");
      return;
    }

    try {
      setIsUpdatingMembers(true);
      const updatedChannel = await addMemberMutation.mutateAsync({
        channelId: channel._id,
        userId,
      });
      success("Member added successfully!");
      onUpdate();
      return updatedChannel;
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err);
      showError(errorMessage);
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
