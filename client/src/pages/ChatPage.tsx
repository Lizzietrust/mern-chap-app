import { useState, useRef, useEffect, useContext } from "react";
import { useApp } from "../contexts/AppContext";
import { useNotifications } from "../contexts/NotificationContext";
import { useTheme } from "../contexts/ThemeContext";
import { Layout } from "../components/Layout";
import { SelectedChatContext } from "../contexts/SelectedChatContext";
import { useSocket } from "../contexts/useSocket";
import {
  type Message,
  type Chat,
  type User,
  type SelectedChatContextType,
  // type ChannelChat,
  isChannelChat,
} from "../types";
import ChatContainer from "../components/chat/ChatContainer";
import { useUsers } from "../hooks/useUsers";
import {
  useUserChats,
  useMessages,
  useCreateChat,
  messageKeys,
  useUploadFile,
  useSendMessage,
} from "../hooks/useChat";
import Sidebar from "../components/chat/Sidebar";
import { useQueryClient } from "@tanstack/react-query";
import { useChannels } from "../hooks/useChannels";
import CreateChannelModal from "../components/chat/CreateChannelModal";
import ChannelSettingsModal from "../components/chat/ChannelSettingsModal";

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
    data: chats = [],
    isLoading: chatsLoading,
    isFetching: chatsFetching,
    refetch: refetchChats,
  } = useUserChats();

  console.log({ chats });

  useEffect(() => {
    if (state.user?._id && !chatsLoading) {
      console.log("🔄 User authenticated, fetching chats...");
      refetchChats();
    }
  }, [state.user?._id, chatsLoading, refetchChats]);

  const { data: messages, isLoading: messagesLoading } = useMessages(
    selectedChat?._id
  );

  const createChatMutation = useCreateChat();
  const uploadFileMutation = useUploadFile();
  const sendMessageMutation = useSendMessage();

  useEffect(() => {
    if (createChatMutation.isError) {
      console.error("Chat creation error:", createChatMutation.error);
      error("Failed to create chat");
    }
  }, [createChatMutation.isError, createChatMutation.error, error]);

  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleFileSelect = async (file: File) => {
    if (!file || !state.user || !selectedChat || isSending) {
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      error(`File too large. Maximum size is ${formatFileSize(maxSize)}`);
      return;
    }

    console.log("Uploading file:", file.name);

    const sender: User = state.user;
    const chatId: string = selectedChat._id;
    const tempMessageId = `temp-${Date.now()}`;
    const messageType = getMessageTypeFromFile(file);

    setIsSending(true);
    const tempMessage: Message = {
      _id: tempMessageId,
      sender: sender,
      messageType: messageType,
      content: `Uploading ${file.name}...`,
      text: `Uploading ${file.name}...`,
      chatId: chatId,
      createdAt: new Date(),
      timestamp: new Date(),
      isOptimistic: true,
    };

    const messagesQueryKey = messageKeys.list(chatId);
    const previousMessages =
      queryClient.getQueryData<Message[]>(messagesQueryKey);
    queryClient.setQueryData<Message[]>(messagesQueryKey, (oldMessages) => {
      return oldMessages ? [...oldMessages, tempMessage] : [tempMessage];
    });

    try {
      const uploadResponse = await uploadFileMutation.mutateAsync(file);

      console.log("File uploaded:", uploadResponse);

      await sendMessageMutation.mutateAsync({
        chatId,
        messageType,
        fileUrl: uploadResponse.fileUrl,
        fileName: uploadResponse.fileName,
        fileSize: uploadResponse.fileSize,
        content: file.name,
      });
      success(`File "${file.name}" sent successfully!`);

      setTimeout(() => {
        queryClient.setQueryData<Message[]>(messagesQueryKey, (oldMessages) => {
          return oldMessages
            ? oldMessages.filter((msg) => msg._id !== tempMessageId)
            : [];
        });
      }, 1000);
    } catch (err) {
      console.error("File upload failed:", err);
      queryClient.setQueryData<Message[]>(
        messagesQueryKey,
        previousMessages || []
      );
      error("Failed to send file. Please try again.");
    } finally {
      setIsSending(false);
    }
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

  const {
    data: channels,
    isLoading: channelsLoading,
    refetch: refetchChannels,
  } = useChannels();
  // const createChannelMutation = useCreateChannel();

  console.log({ channels });

  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [showChannelSettings, setShowChannelSettings] = useState(false);

  // const handleChannelCreated = (channel: ChannelChat) => {
  //   setSelectedChat(channel);
  //   setShowCreateChannelModal(false);
  // };

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

  console.log({ selectedChat });

  const getChatTitle = (): string => {
    if (!selectedChat) return "Select a chat";

    if (selectedChat.type === "channel") {
      return selectedChat.name || "Channel";
    }

    if (selectedChat.type === "direct") {
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

    return "Select a chat";
  };

  const getChatSubtitle = (): string => {
    if (!selectedChat) return "";

    if (selectedChat.type === "channel") {
      return `${selectedChat.members?.length || 0} members • ${
        selectedChat.isPrivate ? "Private" : "Public"
      }`;
    }

    if (selectedChat.type === "direct") {
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

    return "";
  };

  const showLoading = chatsLoading || (chatsFetching && chats.length === 0);

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

  if (showLoading) {
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
            Loading your conversations...
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
        {showLoading ? (
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
            chats={chats || []}
            setSelectedChat={setSelectedChat}
            handleSelectUser={handleSelectUser}
            currentPage={currentPage}
            totalUsers={usersData?.totalUsers || 0}
            onPageChange={handlePageChange}
            onSearch={handleSearch}
            isLoadingUsers={isLoadingUsers}
            searchTerm={searchTerm}
            handleSearch={handleSearch}
            channels={channels || []}
            channelsLoading={channelsLoading}
            onCreateChannel={() => setShowCreateChannelModal(true)}
            onShowChannelSettings={() => setShowChannelSettings(true)}
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
            onShowChannelSettings={() => setShowChannelSettings(true)}
          />
        )}

        {showCreateChannelModal && (
          <CreateChannelModal
            isDark={isDark}
            onClose={() => setShowCreateChannelModal(false)}
            onChannelCreated={(channel) => {
              setSelectedChat(channel);
              setShowCreateChannelModal(false);
            }}
          />
        )}

        {showChannelSettings && selectedChat && isChannelChat(selectedChat) && (
          <ChannelSettingsModal
            isDark={isDark}
            channel={selectedChat}
            onClose={() => setShowChannelSettings(false)}
            onUpdate={() => {
              refetchChannels();
              refetchChats();
            }}
          />
        )}
      </div>
    </Layout>
  );
}
