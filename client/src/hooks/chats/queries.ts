import { useQuery } from "@tanstack/react-query";
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

export const useUserChats = (options?: Partial<ChatQueryOptions>) => {
  const { state } = useApp();

  return useQuery({
    queryKey: CHAT_KEYS.userChats(state.user?._id),
    queryFn: ChatService.getUserChats,
    enabled: options?.enabled ?? !!state.user?._id,
    ...DEFAULT_QUERY_OPTIONS,
    staleTime: options?.staleTime ?? DEFAULT_QUERY_OPTIONS.staleTime,
    gcTime: options?.gcTime ?? DEFAULT_QUERY_OPTIONS.gcTime,
    retry: options?.retry ?? DEFAULT_QUERY_OPTIONS.retry,
  });
};

export const useMessages = (
  chatId: string | null | undefined,
  options?: Partial<ChatQueryOptions>
) => {
  return useQuery({
    queryKey: MESSAGE_KEYS.list(chatId!),
    queryFn: () => ChatService.getMessages(chatId!),
    enabled: options?.enabled ?? !!chatId,
    select: deduplicateMessages,
    ...MESSAGES_QUERY_OPTIONS,
    staleTime: options?.staleTime ?? MESSAGES_QUERY_OPTIONS.staleTime,
    gcTime: options?.gcTime ?? MESSAGES_QUERY_OPTIONS.gcTime,
  });
};
