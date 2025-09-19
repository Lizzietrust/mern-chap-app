import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatApi, apiClient as api } from "../lib/api";
import type { Message } from "../types";

export const chatKeys = {
  all: ["chats"] as const,
  lists: () => [...chatKeys.all, "list"] as const,
  list: (filters: string) => [...chatKeys.lists(), { filters }] as const,
  details: () => [...chatKeys.all, "detail"] as const,
  detail: (id: string) => [...chatKeys.details(), id] as const,
};

export const messageKeys = {
  all: ["messages"] as const,
  lists: () => [...messageKeys.all, "list"] as const,
  list: (chatId: string) => [...messageKeys.lists(), { chatId }] as const,
};

export function useCreateChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => chatApi.createChat(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
    },
  });
}

export function useUserChats() {
  return useQuery({
    queryKey: chatKeys.lists(),
    queryFn: () => api.get("/api/messages/get-user-chats"),
  });
}

export function useMessages(chatId: string | null | undefined) {
  return useQuery<Message[]>({
    queryKey: messageKeys.list(chatId!),
    queryFn: () => api.get(`/api/messages/get-messages/${chatId}`),
    enabled: !!chatId,
  });
}
