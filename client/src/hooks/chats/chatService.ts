import { chatApi, apiClient as api } from "../../lib/api";
import type { Chat, Message, UserChat } from "../../types/types";
import type {
  SendMessageData,
  UploadFileResponse,
  SendMessageResponse,
} from "../../types/chat";
import { isUserChat } from "../../types/chat";

export class ChatService {
  static async createChat(userId: string): Promise<UserChat> {
    const result = await chatApi.createChat(userId);

    if (!isUserChat(result)) {
      throw new Error("Expected UserChat but received ChannelChat");
    }

    return result;
  }

  static async getUserChats(): Promise<Chat[]> {
    console.log("🔄 Fetching user chats...");
    try {
      const result = await chatApi.getUserChats();
      console.log("✅ User chats fetched:", result);
      return result;
    } catch (error) {
      console.error("❌ Error fetching user chats:", error);
      throw error;
    }
  }

  static async markAsRead(chatId: string): Promise<void> {
    await chatApi.markChatAsRead(chatId);
  }

  static async getMessages(chatId: string): Promise<Message[]> {
    console.log("🔍 Fetching messages for chat:", chatId);
    const messages = await api.get<Message[]>(
      `/api/messages/get-messages/${chatId}`
    );
    console.log("✅ Fetched messages:", messages.length);
    return messages;
  }

  static async uploadFile(file: File): Promise<UploadFileResponse> {
    const formData = new FormData();
    formData.append("file", file);

    return api.post<UploadFileResponse>("/api/messages/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }

  static async sendMessage(
    data: SendMessageData
  ): Promise<SendMessageResponse> {
    console.log("📤 Sending message via HTTP:", data);
    const result = await api.post<SendMessageResponse>(
      "/api/messages/send-message",
      data
    );
    return result;
  }

  static async editMessage(
    messageId: string,
    content: string
  ): Promise<Message> {
    console.log("✏️ Editing message:", messageId);
    const result = await api.patch<Message>(`/api/messages/${messageId}/edit`, {
      content,
    });
    return result;
  }

  static async deleteMessage(
    messageId: string,
    deleteForEveryone: boolean = false
  ): Promise<void> {
    console.log("🗑️ Deleting message:", messageId);
    await api.delete(`/api/messages/${messageId}`, {
      data: { deleteForEveryone },
    });
  }
}
