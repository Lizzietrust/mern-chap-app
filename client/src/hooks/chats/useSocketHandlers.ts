import { useEffect, useContext, useCallback, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSocket } from "../useSocket";
import { MESSAGE_KEYS, CHAT_KEYS, useMessages } from "../chats";
import { SelectedChatContext } from "../../contexts/selectedChatContext/SelectedChatContext";
import type {
  SelectedChatContextType,
  Message,
  Chat,
  UserChat,
  User,
  MessageUpdateEvent,
} from "../../types/types";
import { useApp } from "../../contexts/appcontext/index";
import { messageApi, chatApi } from "../../lib/api";
import { useNotifications } from "../../contexts";

interface ChatUpdatedData {
  chatId: string;
  updatedFields: Partial<Chat>;
  updatedAt: string;
}

interface MessageStatusUpdateData {
  messageId: string;
  status: "sent" | "delivered" | "read";
  readBy?: string[] | User[];
  chatId: string;
}

interface MessagesClearedData {
  chatId: string;
  clearedForEveryone: boolean;
}

export const useSocketHandlers = () => {
  const { socket, onlineUsers } = useSocket();
  const { selectedChat } = useContext(
    SelectedChatContext
  ) as SelectedChatContextType;
  const { state } = useApp();
  const queryClient = useQueryClient();
  const { success } = useNotifications();

  const { data: messages } = useMessages(selectedChat?._id);

  const markChatAsReadMutation = useMutation({
    mutationFn: async (chatId: string) => {
      return await chatApi.markChatAsRead(chatId);
    },
  });

  const markMessageAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      return await messageApi.markAsRead(messageId);
    },
  });

  const markedAsReadRef = useRef<string | null>(null);
  const processingMessagesRef = useRef<Set<string>>(new Set());

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

  const markMessagesAsRead = useCallback(
    async (messagesToMark: Message[]) => {
      if (!state.user?._id) return;

      const unreadMessages = messagesToMark.filter(
        (msg) =>
          (msg.status === "sent" || msg.status === "delivered") &&
          (typeof msg.sender === "object"
            ? msg.sender._id !== state.user!._id
            : msg.sender !== state.user!._id) &&
          !processingMessagesRef.current.has(msg._id)
      );

      if (unreadMessages.length === 0) {
        return;
      }

      console.log(`👁️ Marking ${unreadMessages.length} messages as read`);

      unreadMessages.forEach((msg) =>
        processingMessagesRef.current.add(msg._id)
      );

      try {
        const promises = unreadMessages.map(async (message) => {
          try {
            await markMessageAsReadMutation.mutateAsync(message._id);
            console.log(`✅ Marked message ${message._id} as read`);
          } catch (error) {
            console.error(
              `Failed to mark message ${message._id} as read:`,
              error
            );

            processingMessagesRef.current.delete(message._id);
          }
        });

        await Promise.all(promises);
      } catch (error) {
        console.error("Error in markMessagesAsRead:", error);
      }
    },
    [state.user, markMessageAsReadMutation]
  );

  const handleMessageStatusUpdate = useCallback(
    (data: MessageStatusUpdateData) => {
      console.log(
        `📨 Message status update in handler: ${data.messageId} -> ${data.status}`
      );

      const { messageId, status, readBy, chatId } = data;

      processingMessagesRef.current.delete(messageId);

      const messagesQueryKey = MESSAGE_KEYS.list(chatId);

      queryClient.setQueryData<Message[]>(
        messagesQueryKey,
        (oldMessages = []) => {
          return oldMessages.map((msg) =>
            msg._id === messageId
              ? {
                  ...msg,
                  status,
                  readBy: readBy || msg.readBy,
                }
              : msg
          );
        }
      );
    },
    [queryClient]
  );

  const handleMessageUpdate = useCallback(
    (data: MessageUpdateEvent) => {
      console.log("📨 Message update received:", data);

      if (data.chatId === selectedChat?._id) {
        const messagesQueryKey = MESSAGE_KEYS.list(data.chatId);

        if (data.action === "edited" && data.message) {
          queryClient.setQueryData<Message[]>(
            messagesQueryKey,
            (oldMessages = []) =>
              oldMessages.map((msg) =>
                msg._id === data.message!._id ? data.message! : msg
              )
          );
          console.log(`✅ Updated edited message: ${data.message._id}`);
        } else if (data.action === "deleted") {
          if (data.deletedForEveryone) {
            queryClient.setQueryData<Message[]>(
              messagesQueryKey,
              (oldMessages = []) =>
                oldMessages.filter((msg) => msg._id !== data.messageId)
            );
            console.log(`🗑️ Removed deleted message: ${data.messageId}`);
          } else if (data.message) {
            queryClient.setQueryData<Message[]>(
              messagesQueryKey,
              (oldMessages = []) =>
                oldMessages.map((msg) =>
                  msg._id === data.message!._id ? data.message! : msg
                )
            );
            console.log(
              `🔄 Updated deleted message state: ${data.message._id}`
            );
          }
        }
      }
    },
    [selectedChat?._id, queryClient]
  );

  const handleMessagesCleared = useCallback(
    (data: MessagesClearedData) => {
      const { chatId, clearedForEveryone } = data;

      if (chatId === selectedChat?._id) {
        queryClient.invalidateQueries({
          queryKey: MESSAGE_KEYS.list(chatId),
        });

        if (clearedForEveryone) {
          success("Chat has been cleared for everyone");
        } else {
          success("Chat cleared for you");
        }
      }
    },
    [selectedChat?._id, queryClient, success]
  );

  const handleChatCleared = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: CHAT_KEYS.userChats(state.user?._id),
    });
  }, [queryClient, state.user?._id]);

  const handleNewMessage = useCallback(
    (message: Message) => {
      console.log("📨 Received new message via socket:", message);

      const messageChatId = (
        "chatId" in message ? message.chatId : message.chat
      ) as string;

      if (messageChatId === selectedChat?._id) {
        const messagesQueryKey = MESSAGE_KEYS.list(messageChatId);

        queryClient.setQueryData<Message[]>(
          messagesQueryKey,
          (oldData = []) => {
            const existingMessage = oldData.find((m) => m._id === message._id);
            if (existingMessage) {
              console.log("⚠️ Message already exists, skipping duplicate");
              return oldData;
            }

            const filteredMessages = oldData.filter(
              (msg) =>
                !msg.isOptimistic ||
                msg.content !== message.content ||
                (typeof message.sender === "object" &&
                  typeof msg.sender === "object" &&
                  msg.sender._id !== message.sender._id)
            );

            const newMessages = [...filteredMessages, message];
            console.log(
              "✅ Added new message to cache, total:",
              newMessages.length
            );
            return newMessages;
          }
        );

        queryClient.invalidateQueries({ queryKey: ["chats"] });
        queryClient.invalidateQueries({ queryKey: ["userChats"] });

        if (
          state.user?._id &&
          typeof message.sender === "object" &&
          message.sender._id !== state.user._id &&
          message.status === "sent"
        ) {
          console.log(
            `📨 Auto-marking new message ${message._id} as delivered`
          );
          messageApi.markAsDelivered(message._id).catch(console.error);
        }
      }
    },
    [selectedChat?._id, queryClient, state.user?._id]
  );

  const handleChatUpdated = useCallback(
    (data: ChatUpdatedData) => {
      console.log("🔄 Chat updated:", data);
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      queryClient.invalidateQueries({ queryKey: ["userChats"] });
    },
    [queryClient]
  );

  useEffect(() => {
    const chatId = selectedChat?._id;
    const userId = state.user?._id;

    if (!chatId || !userId || !messages) {
      return;
    }

    if (markedAsReadRef.current === chatId || messages.length === 0) {
      return;
    }

    const hasUnreadMessages = messages.some(
      (msg) =>
        (msg.status === "sent" || msg.status === "delivered") &&
        (typeof msg.sender === "object"
          ? msg.sender._id !== userId
          : msg.sender !== userId)
    );

    if (!hasUnreadMessages) {
      markedAsReadRef.current = chatId;
      return;
    }

    const markChatAndMessagesAsRead = async () => {
      try {
        console.log(
          `🔄 Processing chat ${chatId} with ${messages.length} messages`
        );

        await markChatAsReadMutation.mutateAsync(chatId);

        await markMessagesAsRead(messages);

        markedAsReadRef.current = chatId;
        console.log(`✅ Chat ${chatId} and all messages marked as read`);
      } catch (error) {
        console.error("❌ Failed to auto-mark chat/messages as read:", error);
      }
    };

    const timeoutId = setTimeout(markChatAndMessagesAsRead, 1000);

    return () => clearTimeout(timeoutId);
  }, [
    selectedChat?._id,
    state.user?._id,
    messages,
    markChatAsReadMutation,
    markMessagesAsRead,
  ]);

  useEffect(() => {
    markedAsReadRef.current = null;
    processingMessagesRef.current.clear();
  }, [selectedChat?._id]);

  useEffect(() => {
    if (!socket || !selectedChat?._id || !state.user?._id) return;

    console.log("🔌 Setting up socket handlers for chat:", selectedChat._id);

    socket.on("newMessage", handleNewMessage);
    socket.on("messageReceived", handleNewMessage);
    socket.on("messageStatusUpdate", handleMessageStatusUpdate);
    socket.on("messageUpdated", handleMessageUpdate);
    socket.on("messagesCleared", handleMessagesCleared);
    socket.on("chatCleared", handleChatCleared);
    socket.on("chatUpdated", handleChatUpdated);

    return () => {
      console.log("🔌 Cleaning up socket handlers");
      socket.off("newMessage", handleNewMessage);
      socket.off("messageReceived", handleNewMessage);
      socket.off("messageStatusUpdate", handleMessageStatusUpdate);
      socket.off("messageUpdated", handleMessageUpdate);
      socket.off("messagesCleared", handleMessagesCleared);
      socket.off("chatCleared", handleChatCleared);
      socket.off("chatUpdated", handleChatUpdated);
    };
  }, [
    socket,
    selectedChat?._id,
    state.user?._id,
    handleNewMessage,
    handleMessageStatusUpdate,
    handleMessageUpdate,
    handleMessagesCleared,
    handleChatCleared,
    handleChatUpdated,
  ]);

  return {
    getEnhancedParticipants,
  };
};
