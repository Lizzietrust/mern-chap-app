import { useState, useRef, useEffect, useContext } from "react";
import { useApp } from "../contexts/AppContext";
import { useNotifications } from "../contexts/NotificationContext";
import { useTheme } from "../contexts/ThemeContext";
import { Layout } from "../components/Layout";
import { SelectedChatContext } from "../contexts/SelectedChatContext";
import { useSocket } from "../contexts/SocketContext";
import type { Message, Chat, User } from "../types";
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
  const { selectedChat, setSelectedChat } = useContext(SelectedChatContext)!;
  const { sendMessage, socket } = useSocket();
  const queryClient = useQueryClient();
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    data: usersData,
  } = useUsers(1, 10, "");

  const {
    data: chats,
    isLoading: chatsLoading,
  } = useUserChats();

  const {
    data: messages,
    isLoading: messagesLoading,
  } = useMessages(selectedChat?._id);

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

  // Join chat room when selectedChat changes
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
      // Fix: Type assertion or proper typing
      const chat = await createChatMutation.mutateAsync(userId) as Chat;
      setSelectedChat(chat);
      console.log("Chat created/selected:", chat);
    } catch (err) {
      console.error("Error creating or fetching chat:", err);
      error("Failed to create or open chat");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !state.user || !selectedChat || isSending) {
      return;
    }

    const sender: User = state.user;
    const chatId = selectedChat._id;
    const content = newMessage.trim();

    console.log("Sending message:", { chatId, senderId: sender._id, content });

    setIsSending(true);

    // Optimistically update the UI
    const tempMessage: Message = {
      _id: `temp-${Date.now()}`,
      sender: sender,
      messageType: "text",
      content: content,
      chatId: chatId,
      createdAt: new Date(),
      timestamp: new Date(),
    };

    const messagesQueryKey = messageKeys.list(chatId);

    // Optimistically update the messages cache
    queryClient.setQueryData<Message[]>(messagesQueryKey, (oldMessages) => {
      if (!oldMessages) return [tempMessage];
      return [...oldMessages, tempMessage];
    });

    // Clear input immediately for better UX
    setNewMessage("");

    try {
      // Send message via socket
      sendMessage(chatId, sender._id, content);

      // Show typing indicator briefly
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
      }, 1500);

      console.log("Message sent successfully");
    } catch (err) {
      console.error("Failed to send message:", err);

      // Revert optimistic update on error
      queryClient.setQueryData<Message[]>(messagesQueryKey, (oldMessages) => {
        if (!oldMessages) return [];
        return oldMessages.filter((msg) => msg._id !== tempMessage._id);
      });

      // Restore the message if sending failed
      setNewMessage(content);
      error("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj?.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getChatTitle = () => {
    if (!selectedChat) return "Select a chat";

    if ("participants" in selectedChat) {
      const otherUser = selectedChat.participants.find(
        (p) => p._id !== state.user?._id
      );

      if (otherUser) {
        return `${otherUser.firstName} ${otherUser.lastName}`;
      }
      return "Unknown User";
    }

    if ("name" in selectedChat) {
      return selectedChat.name || "Group Chat";
    }

    return "Select a chat";
  };

  const getChatSubtitle = () => {
    if (!selectedChat) return "";

    if ("participants" in selectedChat) {
      const otherUser = selectedChat.participants.find(
        (p) => p._id !== state.user?._id
      );
      if (otherUser && usersData?.users) {
        const user = usersData.users.find((u) => u._id === otherUser._id);
        if (user?.isOnline) return "Online";
        if (user?.lastSeen)
          return `Last seen ${formatTime(user.lastSeen)}`;
        return "Offline";
      }
    }

    if ("memberCount" in selectedChat) {
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
            isDark={isDark}
            selectedChat={selectedChat}
            users={usersData?.users}
            chats={chats}
            channels={[]}
            setSelectedChat={setSelectedChat}
            handleSelectUser={handleSelectUser}
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