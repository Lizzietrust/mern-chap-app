import { useMutation, useQueryClient } from "@tanstack/react-query";
import { chatApi } from "../lib/api";
import type { UserChat } from "../types/types";

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (chatId: string) => chatApi.markChatAsRead(chatId),
    onSuccess: (_, chatId) => {
      queryClient.setQueryData(["chats"], (oldChats: UserChat[]) => {
        return (
          oldChats?.map((chat) =>
            chat._id === chatId ? { ...chat, unreadCount: 0 } : chat
          ) || []
        );
      });

      queryClient.setQueryData(["userChats"], (oldChats: UserChat[]) => {
        return (
          oldChats?.map((chat) =>
            chat._id === chatId ? { ...chat, unreadCount: 0 } : chat
          ) || []
        );
      });
    },
  });
}
