import { useEffect, useContext, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "../useSocket";
import { useMarkAsRead, MESSAGE_KEYS } from "../chats";
import { SelectedChatContext } from "../../contexts/selectedChatContext/SelectedChatContext";
import type {
  SelectedChatContextType,
  Message,
  Chat,
  UserChat,
} from "../../types/types";
import { useApp } from "../../contexts/appcontext/index";

export const useSocketHandlers = () => {
  const { socket, onlineUsers } = useSocket();
  const { selectedChat } = useContext(
    SelectedChatContext
  ) as SelectedChatContextType;
  const { state } = useApp();
  const queryClient = useQueryClient();
  const markAsReadMutation = useMarkAsRead();

  const markedAsReadRef = useRef<string | null>(null);

  const isUserChat = (chat: Chat): chat is UserChat => {
    return chat.type === "direct" && "participants" in chat;
  };

  const getEnhancedParticipants = useCallback(
    (chat: Chat) => {
      if (!isUserChat(chat) || !chat.participants) {
        return undefined;
      }

      return chat.participants.map((participant) => {
        const onlineUser = onlineUsers.find((u) => u._id === participant._id);
        return {
          ...participant,
          isOnline: onlineUser?.isOnline || participant.isOnline || false,
          lastSeen: onlineUser?.lastSeen || participant.lastSeen,
        };
      });
    },
    [onlineUsers]
  );

  useEffect(() => {
    const chatId = selectedChat?._id;
    const userId = state.user?._id;

    if (!chatId || !userId) {
      return;
    }

    if (markedAsReadRef.current === chatId) {
      return;
    }

    const markAsRead = async () => {
      try {
        await markAsReadMutation.mutateAsync(chatId);
        markedAsReadRef.current = chatId;
      } catch (error) {
        console.error("❌ Failed to auto-mark chat as read:", error);
      }
    };

    const timeoutId = setTimeout(markAsRead, 500);

    return () => clearTimeout(timeoutId);
  }, [selectedChat?._id, state.user?._id, markAsReadMutation]);

  useEffect(() => {
    if (!socket || !selectedChat?._id) return;

    const chatId = selectedChat._id;
    const userId = state.user?._id;

    const handleNewMessage = (message: Message) => {
      const messageChatId = "chatId" in message ? message.chatId : message.chat;

      if (messageChatId === chatId) {
        const messagesQueryKey = MESSAGE_KEYS.list(chatId);

        queryClient.setQueryData<Message[]>(
          messagesQueryKey,
          (oldMessages = []) => {
            const filteredMessages = oldMessages.filter(
              (msg) =>
                !msg.isOptimistic ||
                msg.content !== message.content ||
                (typeof message.sender === "object" &&
                  typeof msg.sender === "object" &&
                  msg.sender._id !== message.sender._id)
            );

            const exists = filteredMessages.some(
              (msg) => msg._id === message._id
            );
            if (!exists) {
              return [...filteredMessages, message];
            }

            return filteredMessages;
          }
        );

        if (
          typeof message.sender === "object" &&
          message.sender._id !== userId
        ) {
          markAsReadMutation.mutate(chatId);
        }
      }
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [
    socket,
    selectedChat?._id,
    state.user?._id,
    queryClient,
    markAsReadMutation,
  ]);

  return {
    getEnhancedParticipants,
  };
};
