import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChannelService } from "./channelService";
import { CHANNEL_KEYS } from "../../constants/channels";
import type { ChannelMutationProps } from "../../types/channel";

export const useCreateChannel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ChannelService.createChannel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHANNEL_KEYS.lists() });
    },
  });
};

export const useUpdateChannel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      channelId,
      data,
    }: Omit<ChannelMutationProps, "userId" | "isAdmin">) =>
      ChannelService.updateChannel(channelId, data!),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: CHANNEL_KEYS.lists() });
      queryClient.invalidateQueries({
        queryKey: CHANNEL_KEYS.detail(data._id),
      });
    },
  });
};

export const useAddChannelMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ channelId, userId }: ChannelMutationProps) =>
      ChannelService.addChannelMember(channelId, userId!),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CHANNEL_KEYS.lists() });
      queryClient.invalidateQueries({
        queryKey: CHANNEL_KEYS.members(variables.channelId),
      });
    },
  });
};

export const useRemoveChannelMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ channelId, userId }: ChannelMutationProps) =>
      ChannelService.removeChannelMember(channelId, userId!),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CHANNEL_KEYS.lists() });
      queryClient.invalidateQueries({
        queryKey: CHANNEL_KEYS.members(variables.channelId),
      });
    },
  });
};

export const useUpdateChannelAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ channelId, userId, isAdmin }: ChannelMutationProps) =>
      ChannelService.updateChannelAdmin(channelId, userId!, isAdmin!),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CHANNEL_KEYS.lists() });
      queryClient.invalidateQueries({
        queryKey: CHANNEL_KEYS.members(variables.channelId),
      });
    },
  });
};
