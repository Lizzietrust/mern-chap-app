import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ChannelChat,
  CreateChannelData,
  UpdateChannelData,
  User,
} from "../types";
import { channelApi } from "../lib/api";

const channelKeys = {
  all: ["channels"] as const,
  lists: () => [...channelKeys.all, "list"] as const,
  list: (filters: string) => [...channelKeys.lists(), { filters }] as const,
  details: () => [...channelKeys.all, "detail"] as const,
  detail: (id: string) => [...channelKeys.details(), id] as const,
};

export const useChannels = () => {
  return useQuery<ChannelChat[]>({
    queryKey: channelKeys.lists(),
    queryFn: () => channelApi.getUserChannels(),
  });
};

export const useCreateChannel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (channelData: CreateChannelData): Promise<ChannelChat> =>
      channelApi.createChannel(channelData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: channelKeys.lists() });
    },
  });
};

export const useUpdateChannel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      channelId,
      data,
    }: {
      channelId: string;
      data: UpdateChannelData;
    }): Promise<ChannelChat> => channelApi.updateChannel(channelId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: channelKeys.lists() });
      queryClient.invalidateQueries({ queryKey: channelKeys.detail(data._id) });
    },
  });
};

export const useChannelMembers = (channelId: string) => {
  return useQuery<User[]>({
    queryKey: ["channel-members", channelId],
    queryFn: () => channelApi.getChannelMembers(channelId),
    enabled: !!channelId,
  });
};

export const useAddChannelMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      channelId,
      userId,
    }: {
      channelId: string;
      userId: string;
    }): Promise<ChannelChat> => channelApi.addChannelMember(channelId, userId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["channel-members", variables.channelId],
      });
      queryClient.invalidateQueries({ queryKey: channelKeys.lists() });
    },
  });
};

export const useRemoveChannelMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      channelId,
      userId,
    }: {
      channelId: string;
      userId: string;
    }): Promise<ChannelChat> =>
      channelApi.removeChannelMember(channelId, userId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["channel-members", variables.channelId],
      });
      queryClient.invalidateQueries({ queryKey: channelKeys.lists() });
    },
  });
};

export const useUpdateChannelAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      channelId,
      userId,
      isAdmin,
    }: {
      channelId: string;
      userId: string;
      isAdmin: boolean;
    }): Promise<ChannelChat> =>
      channelApi.updateChannelAdmin(channelId, userId, isAdmin),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["channel-members", variables.channelId],
      });
      queryClient.invalidateQueries({ queryKey: channelKeys.lists() });
    },
  });
};
