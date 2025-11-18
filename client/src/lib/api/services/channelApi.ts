import { apiClient } from "../ApiClient";
import type {
  ChannelChat,
  User as ApiUser,
  CreateChannelData,
  UpdateChannelData,
} from "../../../types/types";

interface ApiClientError {
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
  };
  message?: string;
}

const isApiClientError = (error: unknown): error is ApiClientError => {
  return (
    typeof error === "object" &&
    error !== null &&
    ("response" in error || "message" in error)
  );
};

const extractErrorMessage = (error: unknown): string => {
  if (isApiClientError(error)) {
    return (
      error.response?.data?.message ||
      error.message ||
      "An unexpected error occurred"
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "An unexpected error occurred";
};

export const channelApi = {
  createChannel: async (
    channelData: CreateChannelData
  ): Promise<ChannelChat> => {
    try {
      const response = await apiClient.post<ChannelChat>(
        "/api/channels/create",
        channelData
      );
      return response;
    } catch (error: unknown) {
      const errorMessage = extractErrorMessage(error);
      throw new Error(errorMessage);
    }
  },

  updateChannel: async (
    channelId: string,
    data: UpdateChannelData
  ): Promise<ChannelChat> => {
    try {
      const response = await apiClient.put<ChannelChat>(
        `/api/channels/${channelId}`,
        data
      );
      return response;
    } catch (error: unknown) {
      const errorMessage = extractErrorMessage(error);
      throw new Error(errorMessage);
    }
  },

  getUserChannels: (): Promise<ChannelChat[]> =>
    apiClient.get<ChannelChat[]>("/api/channels/user-channels"),

  getChannelMembers: (channelId: string): Promise<ApiUser[]> =>
    apiClient.get<ApiUser[]>(`/api/channels/${channelId}/members`),

  addChannelMember: async (
    channelId: string,
    userId: string
  ): Promise<ChannelChat> => {
    try {
      const response = await apiClient.post<ChannelChat>(
        `/api/channels/${channelId}/members`,
        {
          userId,
        }
      );
      return response;
    } catch (error: unknown) {
      const errorMessage = extractErrorMessage(error);
      throw new Error(errorMessage);
    }
  },

  removeChannelMember: async (
    channelId: string,
    userId: string
  ): Promise<ChannelChat> => {
    try {
      const response = await apiClient.delete<ChannelChat>(
        `/api/channels/${channelId}/members/${userId}`
      );
      return response;
    } catch (error: unknown) {
      const errorMessage = extractErrorMessage(error);
      throw new Error(errorMessage);
    }
  },

  updateChannelAdmin: async (
    channelId: string,
    userId: string,
    isAdmin: boolean
  ): Promise<ChannelChat> => {
    try {
      const response = await apiClient.put<ChannelChat>(
        `/api/channels/${channelId}/admin`,
        {
          userId,
          isAdmin,
        }
      );
      return response;
    } catch (error: unknown) {
      const errorMessage = extractErrorMessage(error);
      throw new Error(errorMessage);
    }
  },
};
