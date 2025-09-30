import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatApi, apiClient as api } from "../lib/api";
import type { Message, UserChat } from "../types";
import { useApp } from "../contexts/AppContext";

export const chatKeys = {
  all: ["chats"] as const,
  lists: () => [...chatKeys.all, "list"] as const,
  list: (filters: string) => [...chatKeys.lists(), { filters }] as const,
  details: () => [...chatKeys.all, "detail"] as const,
  detail: (id: string) => [...chatKeys.details(), id] as const,
  userChats: (userId?: string) => [...chatKeys.all, "user", userId] as const,
};

export const messageKeys = {
  all: ["messages"] as const,
  lists: () => [...messageKeys.all, "list"] as const,
  list: (chatId: string) => [...messageKeys.lists(), { chatId }] as const,
};

export function useCreateChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: chatApi.createChat,
    onSuccess: (newChat) => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });

      queryClient.setQueryData(["chats"], (oldChats: UserChat[] = []) => {
        return [...oldChats, newChat];
      });
    },
  });
}

export function useUserChats() {
  const { state } = useApp();

  return useQuery<UserChat[]>({
    queryKey: ["chats", state.user?._id],
    queryFn: chatApi.getUserChats,
    enabled: !!state.user?._id,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}

export function useMessages(chatId: string | null | undefined) {
  return useQuery<Message[]>({
    queryKey: messageKeys.list(chatId!),
    queryFn: (): Promise<Message[]> =>
      api.get(`/api/messages/get-messages/${chatId}`),
    enabled: !!chatId,
    select: (data) => {
      const seen = new Set();
      return data.filter((message) => {
        if (seen.has(message._id)) {
          return false;
        }
        seen.add(message._id);
        return true;
      });
    },
  });
}
