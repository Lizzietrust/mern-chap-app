import { useState, useRef, useEffect, useContext } from "react";
import { useApp } from "../contexts/AppContext";
import { useNotifications } from "../contexts/NotificationContext";
import { useTheme } from "../contexts/ThemeContext";
import { Layout } from "../components/Layout";
import { SelectedChatContext } from "../contexts/SelectedChatContext";
import { useSocket } from "../contexts/SocketContext";
import type { Message, Chat, User, SelectedChatContextType } from "../types";
import ChatContainer from "../components/chat/ChatContainer";
import { useUsers } from "../hooks/useUsers";
import {
  useUserChats,
  useMessages,
  useCreateChat,
  messageKeys,
} from "../hooks/useChat";
import Sidebar from "../components/chat/Sidebar";
import { useQueryClient } from "@tanstack/react-query";

export function ChatPage() {
  const { state } = useApp();
  const { success, error } = useNotifications();
  const { isDark } = useTheme();

  const { selectedChat, setSelectedChat } = useContext(
    SelectedChatContext
  ) as SelectedChatContextType;
  const { sendMessage, socket } = useSocket();
  const queryClient = useQueryClient();
  const [isSending, setIsSending] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: usersData, isLoading: isLoadingUsers } = useUsers(
    currentPage,
    10,
    searchTerm
  );

  console.log({ usersData });

  const {
    data: chats,
    isLoading: chatsLoading,
    refetch: refetchChats,
  } = useUserChats();

  console.log({ chats });

  useEffect(() => {
    if (state.user) {
      setSelectedChat(null);
      refetchChats();
    }
  }, [state.user, setSelectedChat, refetchChats]);

  const { data: messages, isLoading: messagesLoading } = useMessages(
    selectedChat?._id
  );

  const createChatMutation = useCreateChat();

  useEffect(() => {
    if (createChatMutation.isError) {
      console.error("Chat creation error:", createChatMutation.error);
      error("Failed to create chat");
    }
  }, [createChatMutation.isError, createChatMutation.error, error]);

  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    success(`You selected ${file.name}`);
    if (e.target) {
      e.target.value = "";
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (selectedChat && socket) {
      socket.emit("joinChat", selectedChat._id);

      return () => {
        socket.emit("leaveChat", selectedChat._id);
      };
    }
  }, [selectedChat, socket]);

  const handleSelectUser = async (userId: string) => {
    try {
      const chat: Chat = await createChatMutation.mutateAsync(userId);
      setSelectedChat(chat);
      console.log("Chat created/selected:", chat);

      await refetchChats();
    } catch (err) {
      console.error("Error creating or fetching chat:", err);
      error("Failed to create or open chat");
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (search: string) => {
    setSearchTerm(search);
    setCurrentPage(1);
  };

  const isTempMessage = (msg: Message): boolean => {
    return !!msg._id && msg._id.startsWith("temp-");
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !state.user || !selectedChat || isSending) {
      return;
    }

    const sender: User = state.user;
    const chatId: string = selectedChat._id;
    const content: string = newMessage.trim();
    const tempMessageId = `temp-${Date.now()}`;

    console.log("Sending message:", { chatId, senderId: sender._id, content });

    setIsSending(true);

    const tempMessage: Message = {
      _id: tempMessageId,
      sender: sender,
      messageType: "text",
      content: content,
      chatId: chatId,
      createdAt: new Date(),
      timestamp: new Date(),
      isOptimistic: true,
    };

    const messagesQueryKey = messageKeys.list(chatId);

    const previousMessages =
      queryClient.getQueryData<Message[]>(messagesQueryKey);

    queryClient.setQueryData<Message[]>(messagesQueryKey, (oldMessages) => {
      if (!oldMessages) return [tempMessage];

      const filteredMessages = oldMessages.filter((msg) => !isTempMessage(msg));
      return [...filteredMessages, tempMessage];
    });

    setNewMessage("");

    try {
      sendMessage(chatId, sender._id, content);

      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
      }, 1500);

      console.log("Message sent successfully");

      setTimeout(() => {
        queryClient.setQueryData<Message[]>(messagesQueryKey, (oldMessages) => {
          if (!oldMessages) return [];
          return oldMessages.filter((msg) => msg._id !== tempMessageId);
        });
      }, 10000);
    } catch (err) {
      console.error("Failed to send message:", err);

      queryClient.setQueryData<Message[]>(
        messagesQueryKey,
        previousMessages || []
      );

      setNewMessage(content);
      error("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (date: Date | string): string => {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    return dateObj.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getChatTitle = (): string => {
    if (!selectedChat) return "Select a chat";

    if (
      "participants" in selectedChat &&
      Array.isArray(selectedChat.participants)
    ) {
      const otherUser = selectedChat.participants.find(
        (p) => p._id !== state.user?._id
      );

      if (otherUser) {
        return (
          otherUser.name ||
          `${otherUser.firstName || ""} ${otherUser.lastName || ""}`.trim() ||
          otherUser.email ||
          "Unknown User"
        );
      }
      return "Unknown User";
    }

    if ("name" in selectedChat) {
      return selectedChat.name || "Group Chat";
    }

    return "Select a chat";
  };

  const getChatSubtitle = (): string => {
    if (!selectedChat) return "";

    if (
      "participants" in selectedChat &&
      Array.isArray(selectedChat.participants)
    ) {
      const otherUser = selectedChat.participants.find(
        (p) => p._id !== state.user?._id
      );

      if (otherUser) {
        if (otherUser.isOnline) return "Online";
        if (otherUser.lastSeen)
          return `Last seen ${formatTime(otherUser.lastSeen)}`;
        return "Offline";
      }
    }

    if (
      "memberCount" in selectedChat &&
      typeof selectedChat.memberCount === "number"
    ) {
      return `${selectedChat.memberCount || 0} members`;
    }

    return "";
  };

  if (!state.user) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDark ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        <div className="text-center">
          <h2
            className={`text-2xl font-bold ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Please log in to access the chat
          </h2>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div
        className={`h-screen flex overflow-hidden ${
          isDark ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        {/* Sidebar */}
        {chatsLoading ? (
          <div
            className={`flex items-center justify-center w-80 ${
              isDark ? "text-white" : "text-black"
            }`}
          >
            <div>Loading chats...</div>
          </div>
        ) : (
          <Sidebar
            key={state.user?._id}
            isDark={isDark}
            selectedChat={selectedChat}
            users={usersData?.users}
            chats={chats}
            channels={[]}
            setSelectedChat={setSelectedChat}
            handleSelectUser={handleSelectUser}
            currentPage={currentPage}
            totalUsers={usersData?.totalUsers || 0}
            onPageChange={handlePageChange}
            onSearch={handleSearch}
            isLoadingUsers={isLoadingUsers}
            searchTerm={searchTerm}
            handleSearch={handleSearch}
          />
        )}

        {/* Main Chat Area */}
        {messagesLoading ? (
          <div
            className={`flex-1 flex items-center justify-center ${
              isDark ? "text-white" : "text-black"
            }`}
          >
            <div>Loading messages...</div>
          </div>
        ) : (
          <ChatContainer
            selectedChat={selectedChat}
            isDark={isDark}
            setSelectedChat={setSelectedChat}
            getChatTitle={getChatTitle}
            getChatSubtitle={getChatSubtitle}
            messages={messages || []}
            formatTime={formatTime}
            isTyping={isTyping}
            messagesEndRef={messagesEndRef}
            handleSendMessage={handleSendMessage}
            handleFileSelect={handleFileSelect}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            isSending={isSending}
          />
        )}
      </div>
    </Layout>
  );
}
