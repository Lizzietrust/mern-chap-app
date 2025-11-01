import { chatApi, apiClient as api } from "../../lib/api";
import type { Chat, Message, UserChat, ChannelChat } from "../../types/types";
import type {
  SendMessageData,
  UploadFileResponse,
  SendMessageResponse,
} from "../../types/chat";
import { isUserChat } from "../../types/chat";

const RETRY_CONFIG = {
  maxRetries: 2,
  baseDelay: 1000,
  maxDelay: 5000,
};

const CHAT_CACHE = {
  userChats: null as Chat[] | null,
  lastFetch: 0,
  CACHE_DURATION: 30000,
};

async function retryRequest<T>(
  operation: () => Promise<T>,
  retries = RETRY_CONFIG.maxRetries,
  delay = RETRY_CONFIG.baseDelay
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0 && isRetryableError(error)) {
      console.warn(`🔄 Retrying request... (${retries} attempts left)`, {
        delay,
        error: getErrorMessage(error),
      });

      await new Promise((resolve) => setTimeout(resolve, delay));

      return retryRequest(
        operation,
        retries - 1,
        Math.min(delay * 2, RETRY_CONFIG.maxDelay)
      );
    }
    throw error;
  }
}

function isRetryableError(error: unknown): boolean {
  if (
    error instanceof Error &&
    error.message.includes("get-user-chats") &&
    error.message.includes("timeout")
  ) {
    return false;
  }

  if (error instanceof Error) {
    return (
      error.message.includes("Network error") ||
      error.message.includes("ECONNABORTED") ||
      error.message.includes("socket") ||
      error.message.includes("connection")
    );
  }

  if (typeof error === "object" && error !== null) {
    const err = error as {
      code?: string;
      message?: string;
      response?: { status?: number };
    };

    const hasNoResponse = !err.response;
    const isConnectionAborted = err.code === "ECONNABORTED";
    const isServerError = Boolean(
      err.response?.status &&
        err.response.status >= 500 &&
        err.response.status < 600
    );

    return hasNoResponse || isConnectionAborted || isServerError;
  }

  return false;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "Unknown error occurred";
}

function getChatDisplayName(chat: Chat): string {
  if (isUserChat(chat)) {
    const userChat = chat as UserChat;
    const otherParticipant = userChat.participants?.[0];
    return (
      otherParticipant?.name ||
      `${otherParticipant?.firstName || ""} ${
        otherParticipant?.lastName || ""
      }`.trim() ||
      otherParticipant?.email ||
      "Direct Chat"
    );
  } else {
    const channelChat = chat as ChannelChat;
    return channelChat.name || "Unnamed Channel";
  }
}

export class ChatService {
  static async createChat(userId: string): Promise<UserChat> {
    return retryRequest(async () => {
      const result = await chatApi.createChat(userId);

      if (!isUserChat(result)) {
        throw new Error("Expected UserChat but received ChannelChat");
      }

      return result;
    });
  }

  static async getUserChats(forceRefresh = false): Promise<Chat[]> {
    const now = Date.now();
    if (
      !forceRefresh &&
      CHAT_CACHE.userChats &&
      now - CHAT_CACHE.lastFetch < CHAT_CACHE.CACHE_DURATION
    ) {
      console.log("📂 Returning cached user chats");
      return CHAT_CACHE.userChats;
    }

    console.log("🔄 Fetching user chats...");
    try {
      const result = await retryRequest(async () => {
        return await chatApi.getUserChats();
      });

      console.log("✅ User chats fetched successfully:", {
        count: result.length,
        chats: result.map((chat) => ({
          id: chat._id,
          type: chat.type,
          title: getChatDisplayName(chat),
        })),
      });

      CHAT_CACHE.userChats = result;
      CHAT_CACHE.lastFetch = now;

      return result;
    } catch (error) {
      console.error("❌ Critical error fetching user chats:", {
        error: getErrorMessage(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      if (CHAT_CACHE.userChats) {
        console.warn("⚠️ Returning stale cached data due to fetch failure");
        return CHAT_CACHE.userChats;
      }

      throw error;
    }
  }

  static clearChatCache(): void {
    CHAT_CACHE.userChats = null;
    CHAT_CACHE.lastFetch = 0;
    console.log("🗑️ Chat cache cleared");
  }

  static async markAsRead(chatId: string): Promise<void> {
    await retryRequest(async () => {
      await chatApi.markChatAsRead(chatId);
    });
  }

  static async getMessages(chatId: string): Promise<Message[]> {
    console.log("🔍 Fetching messages for chat:", chatId);
    const messages = await retryRequest(async () => {
      return await api.get<Message[]>(`/api/messages/get-messages/${chatId}`);
    });
    console.log("✅ Fetched messages:", {
      chatId,
      count: messages.length,
    });
    return messages;
  }

  static async uploadFile(file: File): Promise<UploadFileResponse> {
    const formData = new FormData();
    formData.append("file", file);

    return retryRequest(async () => {
      return await api.post<UploadFileResponse>(
        "/api/messages/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 60000,
        }
      );
    });
  }

  static async sendMessage(
    data: SendMessageData
  ): Promise<SendMessageResponse> {
    console.log("📤 Sending message via HTTP:", {
      chatId: data.chatId,
      messageType: data.messageType,
      contentLength: data.content?.length,
    });

    const result = await retryRequest(async () => {
      return await api.post<SendMessageResponse>(
        "/api/messages/send-message",
        data
      );
    });

    console.log("✅ Message sent successfully:", {
      messageId: result._id,
    });

    return result;
  }

  static async editMessage(
    messageId: string,
    content: string
  ): Promise<Message> {
    console.log("✏️ Editing message:", messageId);
    const result = await retryRequest(async () => {
      return await api.patch<Message>(`/api/messages/${messageId}/edit`, {
        content,
      });
    });
    return result;
  }

  static async deleteMessage(
    messageId: string,
    deleteForEveryone: boolean = false
  ): Promise<void> {
    console.log("🗑️ Deleting message:", messageId);
    await retryRequest(async () => {
      await api.delete(`/api/messages/${messageId}`, {
        data: { deleteForEveryone },
      });
    });
  }
}
