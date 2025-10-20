import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApp } from "../../contexts/appcontext/index";
import { ChatService } from "./chatService";
import { CHAT_KEYS, MESSAGE_KEYS } from "../../constants/chat";
import type { SendMessageData } from "../../types/chat";
import type { UserChat, Chat } from "../../types/types";

const createCacheUpdater = (
  queryClient: ReturnType<typeof useQueryClient>
) => ({
  invalidateChats: () => {
    queryClient.invalidateQueries({ queryKey: CHAT_KEYS.lists() });
  },

  invalidateMessages: (chatId: string) => {
    queryClient.invalidateQueries({ queryKey: MESSAGE_KEYS.list(chatId) });
  },

  invalidateChannels: () => {
    queryClient.invalidateQueries({ queryKey: ["channels"] });
  },

  updateChatUnreadCount: (chatId: string) => {
    queryClient.setQueryData(
      CHAT_KEYS.userChats(),
      (oldChats: UserChat[] | undefined) => {
        if (!oldChats) return oldChats;
        return oldChats.map((chat) =>
          chat._id === chatId ? { ...chat, unreadCount: 0 } : chat
        );
      }
    );

    queryClient.setQueryData(
      CHAT_KEYS.lists(),
      (oldChats: Chat[] | undefined) => {
        if (!oldChats) return oldChats;
        return oldChats.map((chat) =>
          chat._id === chatId ? { ...chat, unreadCount: 0 } : chat
        );
      }
    );
  },
});

export const useCreateChat = () => {
  const queryClient = useQueryClient();
  const { state } = useApp();
  const { invalidateChats } = createCacheUpdater(queryClient);

  return useMutation({
    mutationFn: ChatService.createChat,
    onSuccess: () => {
      invalidateChats();
      queryClient.invalidateQueries({
        queryKey: CHAT_KEYS.userChats(state.user?._id),
      });
    },
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  const { updateChatUnreadCount } = createCacheUpdater(queryClient);

  return useMutation({
    mutationFn: ChatService.markAsRead,
    onSuccess: (_, chatId) => {
      updateChatUnreadCount(chatId);
    },
  });
};

export const useUploadFile = () => {
  return useMutation({
    mutationFn: ChatService.uploadFile,
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  const { invalidateChats, invalidateMessages, invalidateChannels } =
    createCacheUpdater(queryClient);

  return useMutation({
    mutationFn: ChatService.sendMessage,
    onSuccess: (response, variables: SendMessageData) => {
      console.log("✅ Message sent successfully:", response);

      invalidateMessages(variables.chatId);
      invalidateChats();
      invalidateChannels();
    },
    onError: (error, variables: SendMessageData) => {
      console.error("❌ Failed to send message:", error, variables);
    },
  });
};
