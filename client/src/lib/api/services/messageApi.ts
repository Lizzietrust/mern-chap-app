import { apiClient } from "../ApiClient";
import type {
  Message,
  MessageStatusResponse,
  SendMessageData,
  UploadFileResponse,
  SendMessageResponse,
} from "../../../types/types";

export const messageApi = {
  markAsDelivered: (messageId: string): Promise<MessageStatusResponse> =>
    apiClient.patch<MessageStatusResponse>(
      `/api/messages/${messageId}/delivered`
    ),

  markAsRead: (messageId: string): Promise<MessageStatusResponse> =>
    apiClient.patch<MessageStatusResponse>(`/api/messages/${messageId}/read`),

  getMessageStatus: (messageId: string): Promise<MessageStatusResponse> =>
    apiClient.get<MessageStatusResponse>(`/api/messages/${messageId}/status`),

  getChatMessages: async (chatId: string): Promise<Message[]> => {
    const response = await apiClient.get<Message[]>(
      `/api/messages/get-messages/${chatId}`
    );
    return response;
  },

  getChannelMessages: async (channelId: string): Promise<Message[]> => {
    const response = await apiClient.get<Message[]>(
      `/api/channels/${channelId}/messages`
    );
    return response;
  },

  sendMessage: (data: SendMessageData): Promise<SendMessageResponse> =>
    apiClient.post<SendMessageResponse>("/api/messages/send-message", data),

  uploadFile: (file: File): Promise<UploadFileResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    return apiClient.post<UploadFileResponse>(
      "/api/messages/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
  },

  editMessage: (messageId: string, content: string): Promise<Message> =>
    apiClient.patch<Message>(`/api/messages/${messageId}/edit`, { content }),

  deleteMessage: (
    messageId: string,
    deleteForEveryone: boolean = false
  ): Promise<void> =>
    apiClient.delete(`/api/messages/${messageId}`, {
      data: { deleteForEveryone },
    }),
};
