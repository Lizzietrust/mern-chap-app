import { apiClient } from "../ApiClient";
import type { Chat, UserChat } from "../../../types/types";

export interface CreateChatRequest {
  userId: string;
}

export const chatApi = {
  createChat: (userId: string): Promise<Chat> =>
    apiClient.post<Chat>("/api/messages/create-chat", {
      userId,
    } as CreateChatRequest),

  getUserChats: (): Promise<UserChat[]> =>
    apiClient.get<UserChat[]>("/api/messages/get-user-chats"),

  markAsRead: (chatId: string) =>
    apiClient.patch(`/api/messages/chats/${chatId}/read`),

  getUnreadCounts: () =>
    apiClient.get<Record<string, number>>("/api/messages/chats/unread-counts"),
};
