import { useState, useCallback } from "react";
import { useUsers } from "../../hooks/useUsers";
import { useCreateChannel } from "../../hooks/useChannels";
import { useNotifications } from "../../contexts/NotificationContext";
import { useApp } from "../../contexts/AppContext";
import type { ChannelFormData } from "../../types/CreateChannelModal.types";
import type { ChannelChat } from "../../types/types";

export const useCreateChannelModal = (
  onClose: () => void,
  onChannelCreated: (channel: ChannelChat) => void
) => {
  const [step, setStep] = useState<"details" | "members">("details");
  const [formData, setFormData] = useState<ChannelFormData>({
    name: "",
    description: "",
    isPrivate: false,
    selectedMembers: [],
  });

  const { data: usersData } = useUsers(1, 20, "");
  const { success, error } = useNotifications();
  const { mutate: createChannel, isPending: isCreating } = useCreateChannel();
  const { state } = useApp();

  const updateFormData = useCallback((updates: Partial<ChannelFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const toggleMember = useCallback((userId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedMembers: prev.selectedMembers.includes(userId)
        ? prev.selectedMembers.filter((id) => id !== userId)
        : [...prev.selectedMembers, userId],
    }));
  }, []);

  const handleCreateChannel = useCallback(async () => {
    try {
      if (!formData.name.trim()) {
        error("Channel name is required");
        return;
      }

      if (formData.selectedMembers.length === 0) {
        error("Please select at least one member");
        return;
      }

      const channelData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        isPrivate: formData.isPrivate,
        memberIds: formData.selectedMembers,
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
  }, [formData, createChannel, success, error, onClose, onChannelCreated]);

  const availableUsers =
    usersData?.users?.filter((user) => user._id !== state.user?._id) || [];

  return {
    step,
    setStep,
    formData,
    updateFormData,
    toggleMember,
    handleCreateChannel,
    availableUsers,
    isCreating,
  };
};
