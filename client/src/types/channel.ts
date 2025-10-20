import type {
  ChannelChat,
  CreateChannelData,
  UpdateChannelData,
  User,
} from "./types";

export interface ChannelMutationProps {
  channelId: string;
  userId?: string;
  isAdmin?: boolean;
  data?: UpdateChannelData;
}

export interface ChannelQueryOptions {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
}

export type { ChannelChat, CreateChannelData, UpdateChannelData, User };
