import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApp } from "../../contexts/appcontext/index";
import { ChatService } from "./chatService";
import {
  CHAT_KEYS,
  MESSAGE_KEYS,
  DEFAULT_QUERY_OPTIONS,
  MESSAGES_QUERY_OPTIONS,
} from "../../constants/chat";
import type { ChatQueryOptions } from "../../types/chat";
import type { Message } from "../../types/types";

interface SendMessageData {
  chatId: string;
  content?: string;
  messageType: "text" | "image" | "file";
  senderId?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
}

const deduplicateMessages = (data: Message[]): Message[] => {
  const seen = new Set<string>();
  return data.filter((message) => {
    if (seen.has(message._id)) {
      return false;
    }
    seen.add(message._id);
    return true;
  });
};

const createCacheUpdater = (
  queryClient: ReturnType<typeof useQueryClient>
) => ({
  invalidateChats: () => {
    queryClient.invalidateQueries({ queryKey: CHAT_KEYS.lists() });
    queryClient.invalidateQueries({ queryKey: CHAT_KEYS.userChats() });
  },
  invalidateMessages: (chatId: string) => {
    queryClient.invalidateQueries({ queryKey: MESSAGE_KEYS.list(chatId) });
  },
  invalidateUserChats: (userId?: string) => {
    queryClient.invalidateQueries({ queryKey: CHAT_KEYS.userChats(userId) });
  },
});

export const useUserChats = (options?: Partial<ChatQueryOptions>) => {
  const { state } = useApp();

  return useQuery({
    queryKey: CHAT_KEYS.userChats(state.user?._id),
    queryFn: () => ChatService.getUserChats(),
    enabled: options?.enabled ?? !!state.user?._id,
    ...DEFAULT_QUERY_OPTIONS,
    staleTime: options?.staleTime ?? DEFAULT_QUERY_OPTIONS.staleTime,
    gcTime: options?.gcTime ?? DEFAULT_QUERY_OPTIONS.gcTime,
    retry: options?.retry ?? DEFAULT_QUERY_OPTIONS.retry,
  });
};

export const useMessages = (
  chatId: string | null | undefined,
  chatType?: string,
  options?: Partial<ChatQueryOptions>
) => {
  return useQuery({
    queryKey: MESSAGE_KEYS.list(chatId!, chatType),
    queryFn: () => {
      if (!chatId) return [];

      if (chatType === "channel") {
        return ChatService.getChannelMessages(chatId);
      } else {
        return ChatService.getMessages(chatId);
      }
    },
    enabled: options?.enabled ?? !!chatId,
    select: deduplicateMessages,
    ...MESSAGES_QUERY_OPTIONS,
    staleTime: 0,
    gcTime: options?.gcTime ?? MESSAGES_QUERY_OPTIONS.gcTime,
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  const { invalidateChats, invalidateMessages, invalidateUserChats } =
    createCacheUpdater(queryClient);
  const { state } = useApp();

  return useMutation({
    mutationFn: (data: SendMessageData) => {
      const messageData = {
        ...data,
        content: data.content || "",
      };
      return ChatService.sendMessage(messageData);
    },
    onMutate: async (variables: SendMessageData) => {
      await queryClient.cancelQueries({
        queryKey: MESSAGE_KEYS.list(variables.chatId),
      });

      const previousMessages = queryClient.getQueryData(
        MESSAGE_KEYS.list(variables.chatId)
      );

      const currentUserId = state.user?._id;

      const optimisticMessage: Message = {
        _id: `optimistic-${Date.now()}`,
        sender: currentUserId || "",
        content: variables.content || "",
        messageType: variables.messageType,
        chat: variables.chatId,
        status: "sent",
        readBy: [],
        deliveredTo: [],
        timestamp: new Date().toISOString(),
        isDeleted: false,
        deletedForSender: false,
        isEdited: false,
        editHistory: [],
        ...(variables.messageType === "file" ||
        variables.messageType === "image"
          ? {
              fileUrl: variables.fileUrl || "",
              fileName: variables.fileName || "",
              fileSize: variables.fileSize || 0,
            }
          : {}),
        isOptimistic: true,
        isSending: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Message;

      queryClient.setQueryData(
        MESSAGE_KEYS.list(variables.chatId),
        (old: Message[] = []) => {
          return [...old, optimisticMessage];
        }
      );

      return { previousMessages };
    },
    onSuccess: (response, variables: SendMessageData) => {
      console.log("✅ Message sent successfully:", response);

      queryClient.setQueryData(
        MESSAGE_KEYS.list(variables.chatId),
        (old: Message[] = []) => {
          return old.map((msg) =>
            msg._id.startsWith("optimistic-") ? response : msg
          );
        }
      );

      invalidateMessages(variables.chatId);
      invalidateChats();
      if (state.user?._id) {
        invalidateUserChats(state.user._id);
      }
    },
    onError: (error, variables: SendMessageData, context) => {
      console.error("❌ Failed to send message:", error, variables);

      if (context?.previousMessages) {
        queryClient.setQueryData(
          MESSAGE_KEYS.list(variables.chatId),
          context.previousMessages
        );
      }
    },
  });
};

interface DeleteMessageVariables {
  messageId: string;
  chatId: string;
  deleteForEveryone?: boolean;
}

interface EditMessageVariables {
  messageId: string;
  chatId: string;
  content: string;
}

export const useDeleteMessage = () => {
  const queryClient = useQueryClient();
  const { invalidateMessages } = createCacheUpdater(queryClient);

  return useMutation({
    mutationFn: ({ messageId, deleteForEveryone }: DeleteMessageVariables) =>
      ChatService.deleteMessage(messageId, deleteForEveryone),
    onSuccess: (response, variables: DeleteMessageVariables) => {
      queryClient.setQueryData(
        MESSAGE_KEYS.list(variables.chatId),
        (old: Message[] = []) => {
          return old.map((msg) =>
            msg._id === variables.messageId ? response : msg
          );
        }
      );
      invalidateMessages(variables.chatId);
    },
  });
};

export const useEditMessage = () => {
  const queryClient = useQueryClient();
  const { invalidateMessages } = createCacheUpdater(queryClient);

  return useMutation({
    mutationFn: ({ messageId, content }: EditMessageVariables) =>
      ChatService.editMessage(messageId, content),
    onSuccess: (response, variables: EditMessageVariables) => {
      queryClient.setQueryData(
        MESSAGE_KEYS.list(variables.chatId),
        (old: Message[] = []) => {
          return old.map((msg) =>
            msg._id === variables.messageId ? response : msg
          );
        }
      );
      invalidateMessages(variables.chatId);
    },
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  const {
    invalidateChats,
    // invalidateUserChats
  } = createCacheUpdater(queryClient);

  return useMutation({
    mutationFn: (chatId: string) => ChatService.markAsRead(chatId),
    onSuccess: () => {
      invalidateChats();
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.userChats() });
    },
  });
};

export const useUploadFile = () => {
  return useMutation({
    mutationFn: (file: File) => ChatService.uploadFile(file),
  });
};

export const useCreateChat = () => {
  const queryClient = useQueryClient();
  const { invalidateChats, invalidateUserChats } =
    createCacheUpdater(queryClient);

  return useMutation({
    mutationFn: (participantId: string) =>
      ChatService.createChat(participantId),
    onSuccess: () => {
      invalidateChats();
      invalidateUserChats();
    },
  });
};
