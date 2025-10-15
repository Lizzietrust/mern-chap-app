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
  isChannelChat,
  type UserChat,
  type ChannelChat,
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
import { TestConnectionStatus } from "../components/chat/TestSocketConnection";
import { CookieDebug } from "../components/chat/CookieDebug";

export function ChatPage() {
  const { state } = useApp();
  const { success, error } = useNotifications();
  const { isDark } = useTheme();

  const { selectedChat, setSelectedChat } = useContext(
    SelectedChatContext
  ) as SelectedChatContextType;
  const { sendMessage, joinChat, leaveChat, isConnected, onlineUsers, socket } =
    useSocket();
  const queryClient = useQueryClient();
  const [isSending, setIsSending] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: usersData, isLoading: isLoadingUsers } = useUsers(
    currentPage,
    10,
    searchTerm
  );

  const {
    data: chats = [],
    isLoading: chatsLoading,
    isFetching: chatsFetching,
    refetch: refetchChats,
  } = useUserChats();

  useEffect(() => {
    if (state.user?._id && !chatsLoading) {
      console.log("🔄 User authenticated, fetching chats...");
      refetchChats();
    }
  }, [state.user?._id, chatsLoading, refetchChats]);

  // Enhanced deduplication function
  const removeDuplicateChats = (chats: UserChat[]): UserChat[] => {
    const chatMap = new Map();

    chats.forEach((chat) => {
      // Skip chats with no participants or empty participants
      if (!chat.participants || chat.participants.length === 0) {
        console.log("🚫 Skipping chat with no participants:", chat._id);
        return;
      }

      const otherParticipant = chat.participants.find(
        (p) => p._id !== state.user?._id
      );

      // Skip if no other participant found (shouldn't happen with proper data)
      if (!otherParticipant) {
        console.log("🚫 Skipping chat with no other participant:", chat._id);
        return;
      }

      const participantId = otherParticipant._id;
      const existingChat = chatMap.get(participantId);

      if (!existingChat) {
        // First time seeing this participant
        chatMap.set(participantId, chat);
        console.log(
          "✅ Added new chat for participant:",
          participantId,
          chat._id
        );
      } else {
        // Compare timestamps to keep the most recent chat
        const existingTime = existingChat.lastMessageAt
          ? new Date(existingChat.lastMessageAt).getTime()
          : 0;
        const currentTime = chat.lastMessageAt
          ? new Date(chat.lastMessageAt).getTime()
          : 0;
        const existingCreated = new Date(existingChat.createdAt).getTime();
        const currentCreated = new Date(chat.createdAt).getTime();

        // Prefer the chat with the most recent activity, or the newest created if no messages
        if (
          currentTime > existingTime ||
          (currentTime === existingTime && currentCreated > existingCreated)
        ) {
          chatMap.set(participantId, chat);
          console.log(
            "🔄 Replaced chat for participant:",
            participantId,
            "old:",
            existingChat._id,
            "new:",
            chat._id
          );
        } else {
          console.log(
            "➖ Keeping existing chat for participant:",
            participantId,
            existingChat._id
          );
        }
      }
    });

    const result = Array.from(chatMap.values());
    console.log("🎯 Deduplication complete:", {
      input: chats.length,
      output: result.length,
      removed: chats.length - result.length,
    });

    return result;
  };

  // ==================== ADD THIS SEPARATION LOGIC ====================
  // Separate mixed chats array into direct chats and channel chats
  const separateChats = (allChats: Chat[] = []) => {
    const directChats = allChats.filter(
      (chat) => chat?.type === "direct"
    ) as UserChat[];

    const channelChats = allChats.filter(
      (chat) => chat?.type === "channel"
    ) as ChannelChat[];

    return { directChats, channelChats };
  };

  const { directChats, channelChats: separatedChannelChats } =
    separateChats(chats);

  const uniqueDirectChats = removeDuplicateChats(directChats);

  const allChannels = separatedChannelChats;

  useEffect(() => {
    console.log("🔍 Chat Separation Debug:", {
      allChatsCount: chats.length,
      directChatsCount: directChats.length,
      separatedChannelChatsCount: separatedChannelChats.length,
      directChats: directChats,
      separatedChannelChats: separatedChannelChats,
    });
  }, [chats, directChats, separatedChannelChats]);
  // ==================== END SEPARATION LOGIC ====================

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

  // Listen for typing events
  useEffect(() => {
    if (!socket) return;

    const handleTyping = (data: {
      userId: string;
      isTyping: boolean;
      chatId: string;
    }) => {
      if (
        data.chatId === selectedChat?._id &&
        data.userId !== state.user?._id
      ) {
        setTypingUsers((prev) => ({
          ...prev,
          [data.userId]: data.isTyping,
        }));
      }
    };

    socket.on("typing", handleTyping);

    return () => {
      socket.off("typing", handleTyping);
    };
  }, [socket, selectedChat?._id, state.user?._id]);

  // Handle typing indicator
  const handleTyping = () => {
    if (!selectedChat || !socket) return;

    socket.emit("typing", {
      chatId: selectedChat._id,
      isTyping: true,
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing", {
        chatId: selectedChat._id,
        isTyping: false,
      });
    }, 2000);
  };

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
    data: channels = [],
    isLoading: channelsLoading,
    refetch: refetchChannels,
  } = useChannels();

  useEffect(() => {
    console.log("🔍 Channel Debug (Using only separated channels):", {
      allChatsCount: chats.length,
      directChatsCount: directChats.length,
      separatedChannelChatsCount: separatedChannelChats.length,
      separatedChannelChats: separatedChannelChats.map((c) => ({
        id: c._id,
        name: c.name,
      })),
    });
  }, [chats, directChats, separatedChannelChats]);

  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [showChannelSettings, setShowChannelSettings] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (selectedChat && isConnected) {
      joinChat(selectedChat._id);

      return () => {
        leaveChat(selectedChat._id);
      };
    }
  }, [selectedChat, isConnected, joinChat, leaveChat]);

  // In your ChatPage component, add a function to enhance participants with online status
  const getEnhancedParticipants = (chat: Chat) => {
    if (!chat.participants) return chat.participants;

    return chat.participants.map((participant) => {
      const onlineUser = onlineUsers.find((u) => u._id === participant._id);
      return {
        ...participant,
        isOnline: onlineUser?.isOnline || participant.isOnline || false,
        lastSeen: onlineUser?.lastSeen || participant.lastSeen,
      };
    });
  };

  // Update the selectedChat to include enhanced participants when needed
  useEffect(() => {
    if (selectedChat && selectedChat.type === "direct") {
      // This will ensure the selectedChat has the latest online status
      const enhancedParticipants = getEnhancedParticipants(selectedChat);
      setSelectedChat({
        ...selectedChat,
        participants: enhancedParticipants,
      });
    }
  }, [onlineUsers, selectedChat?._id]); // Re-run when onlineUsers change or chat changes

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !state.user || !selectedChat || isSending) {
      return;
    }

    const sender: User = state.user;
    const chatId: string = selectedChat._id;
    const content: string = newMessage.trim();
    const tempMessageId = `temp-${Date.now()}-${sender._id}`;

    console.log("Sending message:", { chatId, senderId: sender._id, content });

    setIsSending(true);

    const tempMessage: Message = {
      _id: tempMessageId,
      sender: sender,
      messageType: "text",
      content: content,
      text: content,
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
      return [...oldMessages, tempMessage];
    });

    setNewMessage("");

    // Stop typing indicator
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

      console.log("Message sent successfully via HTTP");

      setTimeout(() => {
        queryClient.setQueryData<Message[]>(messagesQueryKey, (oldMessages) => {
          return oldMessages?.filter((msg) => msg._id !== tempMessageId) || [];
        });
      }, 500);
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
        // Get the latest online status from socket context
        const onlineUser = onlineUsers.find((u) => u._id === otherUser._id);
        const isOnline = onlineUser?.isOnline || false;
        const lastSeen = onlineUser?.lastSeen || otherUser.lastSeen;

        console.log("🔍 Chat Subtitle Debug:", {
          otherUserId: otherUser._id,
          onlineUsers: onlineUsers.map((u) => u._id),
          isOnline,
          lastSeen,
          onlineUserData: onlineUser,
        });

        if (isOnline) return "Online";
        if (lastSeen) return `Last seen ${formatTime(lastSeen)}`;
        return "Offline";
      }
    }

    return "";
  };

  const isTyping = Object.values(typingUsers).some((isTyping) => isTyping);

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
            directChats={uniqueDirectChats}
            channels={allChannels}
            setSelectedChat={setSelectedChat}
            handleSelectUser={handleSelectUser}
            currentPage={currentPage}
            totalUsers={usersData?.totalUsers || 0}
            onPageChange={handlePageChange}
            onSearch={handleSearch}
            isLoadingUsers={isLoadingUsers}
            searchTerm={searchTerm}
            handleSearch={handleSearch}
            channelsLoading={false}
            onCreateChannel={() => setShowCreateChannelModal(true)}
            onShowChannelSettings={() => setShowChannelSettings(true)}
          />
        )}

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
            // getChatSubtitle={getChatSubtitle}
            messages={messages || []}
            formatTime={formatTime}
            isTyping={isTyping}
            messagesEndRef={messagesEndRef}
            handleSendMessage={handleSendMessage}
            handleFileSelect={handleFileSelect}
            newMessage={newMessage}
            setNewMessage={(msg) => {
              setNewMessage(msg);
              if (msg.trim()) {
                handleTyping();
              }
            }}
            isSending={isSending}
            onShowChannelSettings={() => setShowChannelSettings(true)}
            stateUser={state.user}
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
