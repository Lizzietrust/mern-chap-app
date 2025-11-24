import { apiClient } from "../ApiClient";
import type { Chat, Message, UserChat } from "../../../types/types";

export interface CreateChatRequest {
  userId: string;
}

export interface ClearChatResponse {
  message: string;
  chatId: string;
  deletedForEveryone?: boolean;
}

export const chatApi = {
  createChat: (userId: string): Promise<Chat> =>
    apiClient.post<Chat>("/api/messages/create-chat", {
      userId,
    } as CreateChatRequest),

  getUserChats: (): Promise<UserChat[]> =>
    apiClient.get<UserChat[]>("/api/messages/get-user-chats"),

  markChatAsRead: (chatId: string) =>
    apiClient.patch(`/api/messages/chats/${chatId}/read`),

  getUnreadCounts: () =>
    apiClient.get<Record<string, number>>("/api/messages/chats/unread-counts"),

  clearChat: (chatId: string): Promise<ClearChatResponse> =>
    apiClient.delete<ClearChatResponse>(`/api/messages/chats/${chatId}/clear`),

  clearChatMessages: (
    chatId: string,
    deleteForEveryone: boolean = false
  ): Promise<ClearChatResponse> =>
    apiClient.delete<ClearChatResponse>(
      `/api/messages/chats/${chatId}/messages`,
      {
        data: { deleteForEveryone },
      }
    ),

  async getSharedMedia(userId1: string, userId2: string): Promise<Message[]> {
    const response = await apiClient.get<{ media: Message[] }>(
      `/api/messages/chats/shared-media`,
      {
        params: { userId1, userId2 },
      }
    );
    return response.media || [];
  },

  async getSharedMediaPaginated(
    userId1: string,
    userId2: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{
    media: Message[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }> {
    const response = await apiClient.get<{
      media: Message[];
      totalCount: number;
      totalPages: number;
      currentPage: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    }>(`/chats/shared-media/paginated`, {
      params: { userId1, userId2, page, limit },
    });
    return response;
  },
};
