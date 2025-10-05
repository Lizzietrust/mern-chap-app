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
  const { state } = useApp();

  return useMutation({
    mutationFn: chatApi.createChat,
    onSuccess: (newChat) => {
      queryClient.invalidateQueries({ queryKey: ["chats", state.user?._id] });

      queryClient.setQueryData(
        ["chats", state.user?._id],
        (oldChats: UserChat[] = []) => {
          return [...oldChats, newChat];
        }
      );
    },
  });
}

export function useUserChats() {
  const { state } = useApp();

  console.log("🔍 useUserChats debug:", {
    userId: state.user?._id,
    hasUser: !!state.user,
    enabled: !!state.user?._id,
  });

  return useQuery<UserChat[]>({
    queryKey: ["chats", state.user?._id],
    queryFn: async () => {
      console.log("🔄 Fetching user chats...");
      try {
        const result = await chatApi.getUserChats();
        console.log("✅ User chats fetched:", result);
        return result;
      } catch (error) {
        console.error("❌ Error fetching user chats:", error);
        throw error;
      }
    },
    enabled: !!state.user?._id,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
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

export function useUploadFile() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      return api.post<{
        fileUrl: string;
        fileName: string;
        fileSize: number;
      }>("/api/messages/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      chatId: string;
      messageType: "text" | "image" | "file";
      fileUrl?: string;
      fileName?: string;
      fileSize?: number;
      content: string;
    }) => {
      return api.post("/api/messages/send-message", data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: messageKeys.list(variables.chatId),
      });
    },
  });
}
