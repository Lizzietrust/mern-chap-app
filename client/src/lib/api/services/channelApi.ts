import { apiClient } from "../ApiClient";
import type {
  ChannelChat,
  User as ApiUser,
  CreateChannelData,
  UpdateChannelData,
} from "../../../types/types";

export const channelApi = {
  createChannel: (channelData: CreateChannelData): Promise<ChannelChat> =>
    apiClient.post<ChannelChat>("/api/channels/create", channelData),

  updateChannel: (
    channelId: string,
    data: UpdateChannelData
  ): Promise<ChannelChat> =>
    apiClient.put<ChannelChat>(`/api/channels/${channelId}`, data),

  getUserChannels: (): Promise<ChannelChat[]> =>
    apiClient.get<ChannelChat[]>("/api/channels/user-channels"),

  getChannelMembers: (channelId: string): Promise<ApiUser[]> =>
    apiClient.get<ApiUser[]>(`/api/channels/${channelId}/members`),

  addChannelMember: (channelId: string, userId: string): Promise<ChannelChat> =>
    apiClient.post<ChannelChat>(`/api/channels/${channelId}/members`, {
      userId,
    }),

  removeChannelMember: (
    channelId: string,
    userId: string
  ): Promise<ChannelChat> =>
    apiClient.delete<ChannelChat>(
      `/api/channels/${channelId}/members/${userId}`
    ),

  updateChannelAdmin: (
    channelId: string,
    userId: string,
    isAdmin: boolean
  ): Promise<ChannelChat> =>
    apiClient.put<ChannelChat>(`/api/channels/${channelId}/admin`, {
      userId,
      isAdmin,
    }),
};
