import { useQuery } from "@tanstack/react-query";
import { useApp } from "../../contexts/appcontext/index";
import { ChannelService } from "./channelService";
import { CHANNEL_KEYS, DEFAULT_QUERY_OPTIONS } from "../../constants/channels";
import type { ChannelQueryOptions } from "../../types/channel";

export const useChannels = (options?: Partial<ChannelQueryOptions>) => {
  const { state } = useApp();

  return useQuery({
    queryKey: [...CHANNEL_KEYS.lists(), state.user?._id],
    queryFn: ChannelService.getUserChannels,
    enabled: options?.enabled ?? !!state.user,
    ...DEFAULT_QUERY_OPTIONS,
    staleTime: options?.staleTime ?? DEFAULT_QUERY_OPTIONS.staleTime,
    gcTime: options?.gcTime ?? DEFAULT_QUERY_OPTIONS.gcTime,
  });
};

export const useChannelMembers = (
  channelId: string,
  options?: Partial<ChannelQueryOptions>
) => {
  return useQuery({
    queryKey: CHANNEL_KEYS.members(channelId),
    queryFn: () => ChannelService.getChannelMembers(channelId),
    enabled: options?.enabled ?? !!channelId,
    ...DEFAULT_QUERY_OPTIONS,
  });
};
