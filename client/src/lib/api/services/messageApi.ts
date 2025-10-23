import { apiClient } from "../ApiClient";
import type { MessageStatusResponse } from "../../../types/types";

export const messageApi = {
  markAsDelivered: (messageId: string): Promise<MessageStatusResponse> =>
    apiClient.patch<MessageStatusResponse>(
      `/api/messages/${messageId}/delivered`
    ),

  markAsRead: (messageId: string): Promise<MessageStatusResponse> =>
    apiClient.patch<MessageStatusResponse>(`/api/messages/${messageId}/read`),

  getMessageStatus: (messageId: string): Promise<MessageStatusResponse> =>
    apiClient.get<MessageStatusResponse>(`/api/messages/${messageId}/status`),
};
