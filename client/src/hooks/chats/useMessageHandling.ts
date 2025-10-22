import { useState, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { QueryClient, QueryKey } from "@tanstack/react-query";

import { useNotifications } from "../../contexts";
import { useSocket } from "../useSocket";
import { useUploadFile, useSendMessage, MESSAGE_KEYS } from "../chats";
import type { Message, User, Chat } from "../../types/types";

export const useMessageHandling = (
  selectedChat: Chat | null,
  user: User | null
) => {
  const [isSending, setIsSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [typingUsers] = useState<Record<string, boolean>>({});
  const typingTimeoutRef = useRef<number | null>(null);
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();
  const { socket } = useSocket();

  const uploadFileMutation = useUploadFile();
  const sendMessageMutation = useSendMessage();

  const handleTyping = useCallback(() => {
    if (!selectedChat || !socket) return;

    socket.emit("typing", {
      chatId: selectedChat._id,
      isTyping: true,
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      socket.emit("typing", {
        chatId: selectedChat._id,
        isTyping: false,
      });
    }, 2000);
  }, [selectedChat, socket]);

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!file || !user || !selectedChat || isSending) {
        return;
      }

      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        error(`File too large. Maximum size is ${formatFileSize(maxSize)}`);
        return;
      }

      const chatId: string = selectedChat._id;
      const tempMessageId = `temp-${Date.now()}`;
      const messageType = getMessageTypeFromFile(file);

      setIsSending(true);

      const tempMessage: Message = createTempMessage(
        tempMessageId,
        user,
        chatId,
        messageType,
        `Uploading ${file.name}...`
      );

      const messagesQueryKey = MESSAGE_KEYS.list(chatId);
      addOptimisticMessage(queryClient, messagesQueryKey, tempMessage);

      try {
        const uploadResponse = await uploadFileMutation.mutateAsync(file);

        await sendMessageMutation.mutateAsync({
          chatId,
          messageType,
          fileUrl: uploadResponse.fileUrl,
          fileName: uploadResponse.fileName,
          fileSize: uploadResponse.fileSize,
          content: file.name,
        });

        success(`File "${file.name}" sent successfully!`);
        removeOptimisticMessage(queryClient, messagesQueryKey, tempMessageId);
      } catch (err) {
        console.error("File upload failed:", err);
        error("Failed to send file. Please try again.");
      } finally {
        setIsSending(false);
      }
    },
    [
      user,
      selectedChat,
      isSending,
      queryClient,
      uploadFileMutation,
      sendMessageMutation,
      success,
      error,
    ]
  );

  const handleSendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!newMessage.trim() || !user || !selectedChat || isSending) {
        return;
      }

      const chatId: string = selectedChat._id;
      const content: string = newMessage.trim();
      const tempMessageId = `temp-${Date.now()}-${user._id}`;

      setIsSending(true);

      const tempMessage: Message = createTempMessage(
        tempMessageId,
        user,
        chatId,
        "text",
        content
      );

      const messagesQueryKey = MESSAGE_KEYS.list(chatId);
      addOptimisticMessage(queryClient, messagesQueryKey, tempMessage);

      setNewMessage("");

      if (socket) {
        socket.emit("typing", {
          chatId: selectedChat._id,
          isTyping: false,
        });
      }

      try {
        await sendMessageMutation.mutateAsync({
          chatId,
          messageType: "text",
          content: content,
        });

        removeOptimisticMessage(queryClient, messagesQueryKey, tempMessageId);
      } catch (err) {
        console.error("❌ Failed to send message:", err);
        markMessageAsFailed(queryClient, messagesQueryKey, tempMessageId);
        setNewMessage(content);
        error("Failed to send message. Please try again.");
      } finally {
        setIsSending(false);
      }
    },
    [
      newMessage,
      user,
      selectedChat,
      isSending,
      queryClient,
      sendMessageMutation,
      socket,
      error,
    ]
  );

  return {
    isSending,
    newMessage,
    setNewMessage,
    typingUsers,
    handleTyping,
    handleFileSelect,
    handleSendMessage,
  };
};

const getMessageTypeFromFile = (file: File): "text" | "image" | "file" => {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "file";
  if (file.type.startsWith("audio/")) return "file";
  return "file";
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const createTempMessage = (
  id: string,
  sender: User,
  chatId: string,
  messageType: "text" | "image" | "file",
  content: string
): Message => {
  const baseMessage = {
    _id: id,
    sender: sender,
    messageType,
    content,
    text: content,
    chat: chatId,
    createdAt: new Date(),
    isOptimistic: true,
    isSending: true,
  };

  switch (messageType) {
    case "image":
    case "file":
      return {
        ...baseMessage,
        fileUrl: "",
        fileName: content,
        fileSize: 0,
      } as Message;

    case "text":
    default:
      return baseMessage as Message;
  }
};

const addOptimisticMessage = (
  queryClient: QueryClient,
  queryKey: QueryKey,
  message: Message
) => {
  queryClient.setQueryData<Message[]>(queryKey, (oldMessages = []) => [
    ...oldMessages,
    message,
  ]);
};

const removeOptimisticMessage = (
  queryClient: QueryClient,
  queryKey: QueryKey,
  messageId: string
) => {
  setTimeout(() => {
    queryClient.setQueryData<Message[]>(queryKey, (oldMessages = []) =>
      oldMessages.filter((msg) => msg._id !== messageId)
    );
  }, 1000);
};

const markMessageAsFailed = (
  queryClient: QueryClient,
  queryKey: QueryKey,
  messageId: string
) => {
  queryClient.setQueryData<Message[]>(queryKey, (oldMessages = []) =>
    oldMessages.map((msg) =>
      msg._id === messageId ? { ...msg, failed: true, isSending: false } : msg
    )
  );
};
