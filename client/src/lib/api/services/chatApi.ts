import { apiClient } from "../ApiClient";
import type { Chat, UserChat } from "../../../types/types";

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
};
