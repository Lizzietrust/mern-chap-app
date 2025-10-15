import { useMutation, useQueryClient } from "@tanstack/react-query";
import { chatApi } from "../lib/api";

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (chatId: string) => chatApi.markAsRead(chatId),
    onSuccess: (_, chatId) => {
      // Update the local cache to reset unread count
      queryClient.setQueryData(["chats"], (oldChats: any[]) => {
        return (
          oldChats?.map((chat) =>
            chat._id === chatId ? { ...chat, unreadCount: 0 } : chat
          ) || []
        );
      });

      queryClient.setQueryData(["userChats"], (oldChats: any[]) => {
        return (
          oldChats?.map((chat) =>
            chat._id === chatId ? { ...chat, unreadCount: 0 } : chat
          ) || []
        );
      });
    },
  });
}
