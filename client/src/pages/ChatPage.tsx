import React from "react";
import { useTheme } from "../contexts/theme";
import { Layout } from "../components/Layout";
import { useSocket } from "../hooks/useSocket";
import { useMessages } from "../hooks/chats";
import { isChannelChat, type ChannelChat } from "../types/types";

import { useChatLogic } from "../hooks/chats/useChatLogic";
import { useChatData } from "../hooks/chats/useChatData";
import { useMessageHandling } from "../hooks/chats/useMessageHandling";
import { useSocketHandlers } from "../hooks/chats/useSocketHandlers";

import Sidebar from "../components/chat/sidebar/Sidebar";
import ChatContainer from "../components/chat/ChatContainer";
import CreateChannelModal from "../components/chat/create-channel-modal.tsx/CreateChannelModal";
import ChannelSettingsModal from "../components/chat/channel-settings/ChannelSettingsModal";

import {
  getChatTitle,
  formatTime,
  getDisplayUnreadCount,
} from "../utils/chat/chatUtils";
import { chatApi } from "../lib/api";
import type { User } from "../types/auth";
import { useChannels } from "../hooks/channels";

export function ChatPage() {
  const { isDark } = useTheme();
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const {
    user,
    selectedChat,
    setSelectedChat,
    currentPage,
    searchTerm,
    handlePageChange,
    handleSearch,
  } = useChatLogic();
  const {
    usersData,
    isLoadingUsers,
    chatsLoading,
    chatsFetching,
    refetchChats,
    uniqueDirectChats,
    separatedChannelChats,
    refetchChannels,
  } = useChatData({ currentPage, searchTerm, user });
  const {
    isSending,
    newMessage,
    setNewMessage,
    typingUsers,
    handleTyping,
    handleFileSelect,
    handleSendMessage,
  } = useMessageHandling(selectedChat, user);
  useSocketHandlers();

  const { joinChat, leaveChat, isConnected } = useSocket();

  const [showCreateChannelModal, setShowCreateChannelModal] =
    React.useState(false);
  const [showChannelSettings, setShowChannelSettings] = React.useState(false);
  const [isCreatingChat, setIsCreatingChat] = React.useState(false);

  const { data: messages, isLoading: messagesLoading } = useMessages(
    selectedChat?._id,
    selectedChat?.type
  );

  const {
    data: channelsData,
    // isLoading: channelsLoading
  } = useChannels();

  const allChannels = React.useMemo(() => {
    const channelsFromChats = separatedChannelChats || [];
    const channelsFromHook = channelsData || [];

    if (channelsFromChats.length > 0) {
      return channelsFromChats;
    }

    return channelsFromHook;
  }, [separatedChannelChats, channelsData]);

  const currentChatRoomRef = React.useRef<string | null>(null);

  const usersPerPage = 10;
  const totalPages = Math.ceil((usersData?.totalUsers || 0) / usersPerPage);

  const handleChannelUpdate = React.useCallback(
    (updatedChannel?: ChannelChat) => {
      if (
        updatedChannel &&
        selectedChat &&
        selectedChat._id === updatedChannel._id
      ) {
        setSelectedChat(updatedChannel);
      }
      refetchChannels();
      refetchChats();
    },
    [selectedChat, setSelectedChat, refetchChannels, refetchChats]
  );

  React.useEffect(() => {
    const chatId = selectedChat?._id;

    if (!chatId || !isConnected) {
      if (currentChatRoomRef.current) {
        leaveChat(currentChatRoomRef.current);
        currentChatRoomRef.current = null;
      }
      return;
    }

    if (currentChatRoomRef.current === chatId) {
      return;
    }

    if (currentChatRoomRef.current) {
      leaveChat(currentChatRoomRef.current);
    }

    joinChat(chatId);
    currentChatRoomRef.current = chatId;

    return () => {
      if (currentChatRoomRef.current === chatId) {
        leaveChat(chatId);
        currentChatRoomRef.current = null;
      }
    };
  }, [selectedChat?._id, isConnected, joinChat, leaveChat]);

  React.useEffect(() => {
    if (messagesEndRef.current && messages && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const isTyping = Object.values(typingUsers).some((isTyping) => isTyping);
  const showLoading =
    chatsLoading || (chatsFetching && uniqueDirectChats.length === 0);

  const getSafeChatTitle = () => {
    if (!selectedChat) return "Select a chat";
    return getChatTitle(selectedChat, user);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleSelectUser = React.useCallback(
    async (userId: string) => {
      try {
        setIsCreatingChat(true);

        const existingChat = uniqueDirectChats.find(
          (chat) =>
            chat.type === "direct" &&
            chat.participants.some(
              (participant: User) => participant._id === userId
            )
        );

        if (existingChat) {
          setSelectedChat(existingChat);
        } else {
          const newChat = await chatApi.createChat(userId);
          setSelectedChat(newChat);
          refetchChats();
        }
      } catch (error) {
        console.error("Failed to create or select chat:", error);
      } finally {
        setIsCreatingChat(false);
      }
    },
    [uniqueDirectChats, setSelectedChat, refetchChats]
  );

  const handleShowChannelSettings = React.useCallback(
    (channel: ChannelChat) => {
      setSelectedChat(channel);
      setShowChannelSettings(true);
    },
    [setSelectedChat]
  );

  const fixedMessagesEndRef = React.useRef<HTMLDivElement>(null);

  if (!user) {
    return <LoginRequired isDark={isDark} />;
  }

  if (showLoading) {
    return <LoadingState isDark={isDark} />;
  }

  return (
    <Layout>
      <div
        className={`h-screen flex overflow-hidden ${
          isDark ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        {showLoading ? (
          <LoadingSidebar isDark={isDark} />
        ) : (
          <Sidebar
            key={user._id}
            isDark={isDark}
            selectedChat={selectedChat}
            users={usersData?.users}
            handleSearch={handleSearch}
            directChats={uniqueDirectChats}
            channels={allChannels}
            setSelectedChat={setSelectedChat}
            currentPage={currentPage}
            totalUsers={usersData?.totalUsers || 0}
            onPageChange={handlePageChange}
            onSearch={handleSearch}
            isLoadingUsers={isLoadingUsers || isCreatingChat}
            searchTerm={searchTerm}
            onCreateChannel={() => setShowCreateChannelModal(true)}
            onShowChannelSettings={handleShowChannelSettings}
            getDisplayUnreadCount={(chat) =>
              getDisplayUnreadCount(chat, selectedChat?._id, user._id)
            }
            getChannelDisplayUnreadCount={(channel) =>
              getDisplayUnreadCount(channel, selectedChat?._id, user._id)
            }
            onNextPage={handleNextPage}
            onPrevPage={handlePrevPage}
            handleSelectUser={handleSelectUser}
          />
        )}

        {messagesLoading ? (
          <LoadingMessages isDark={isDark} />
        ) : (
          <ChatContainer
            selectedChat={selectedChat}
            isDark={isDark}
            setSelectedChat={setSelectedChat}
            getChatTitle={getSafeChatTitle}
            messages={messages || []}
            formatTime={formatTime}
            isTyping={isTyping}
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
            onShowChannelSettings={() => {
              if (selectedChat && isChannelChat(selectedChat)) {
                setShowChannelSettings(true);
              }
            }}
            stateUser={user}
            messagesEndRef={fixedMessagesEndRef}
          />
        )}

        {/* Modals */}
        {showCreateChannelModal && (
          <CreateChannelModal
            isDark={isDark}
            onClose={() => setShowCreateChannelModal(false)}
            onChannelCreated={(channel) => {
              setSelectedChat(channel);
              setShowCreateChannelModal(false);
              refetchChannels();
              refetchChats();
            }}
          />
        )}

        {showChannelSettings && selectedChat && isChannelChat(selectedChat) && (
          <ChannelSettingsModal
            isDark={isDark}
            channel={selectedChat}
            onClose={() => setShowChannelSettings(false)}
            onUpdate={handleChannelUpdate}
          />
        )}
      </div>
    </Layout>
  );
}

const LoginRequired: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <div
    className={`min-h-screen flex items-center justify-center ${
      isDark ? "bg-gray-900" : "bg-gray-50"
    }`}
  >
    <div className="text-center">
      <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-8 h-8 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>
      <h2
        className={`text-2xl font-bold mb-2 ${
          isDark ? "text-white" : "text-gray-900"
        }`}
      >
        Please log in to access the chat
      </h2>
      <p className={isDark ? "text-gray-400" : "text-gray-600"}>
        Sign in to start chatting with your friends
      </p>
    </div>
  </div>
);

const LoadingState: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <div
    className={`min-h-screen flex items-center justify-center ${
      isDark ? "bg-gray-900" : "bg-gray-50"
    }`}
  >
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <h2
        className={`text-2xl font-bold mb-2 ${
          isDark ? "text-white" : "text-gray-900"
        }`}
      >
        Loading your conversations
      </h2>
      <div className="flex justify-center space-x-1">
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
        <div
          className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
          style={{ animationDelay: "0.1s" }}
        ></div>
        <div
          className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
          style={{ animationDelay: "0.2s" }}
        ></div>
      </div>
    </div>
  </div>
);

const LoadingSidebar: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <div
    className={`w-80 flex flex-col ${
      isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
    } border-r`}
  >
    {/* Sidebar Header Skeleton */}
    <div
      className={`p-4 border-b ${
        isDark ? "border-gray-700" : "border-gray-200"
      }`}
    >
      <div className="flex justify-between items-center">
        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-32 animate-pulse"></div>
        <div className="flex space-x-2">
          <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
          <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
        </div>
      </div>
    </div>

    {/* Chat List Skeleton */}
    <div className="flex-1 p-4 space-y-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center space-x-3">
          <div className="h-12 w-12 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2 animate-pulse"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2 animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>

    {/* User Profile Skeleton */}
    <div
      className={`p-4 border-t ${
        isDark ? "border-gray-700" : "border-gray-200"
      }`}
    >
      <div className="flex items-center space-x-3">
        <div className="h-10 w-10 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24 mb-1 animate-pulse"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16 animate-pulse"></div>
        </div>
      </div>
    </div>
  </div>
);

const LoadingMessages: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <div
    className={`flex-1 flex flex-col ${isDark ? "bg-gray-800" : "bg-white"}`}
  >
    {/* Chat Header Skeleton */}
    <div
      className={`p-4 border-b ${
        isDark ? "border-gray-700" : "border-gray-200"
      }`}
    >
      <div className="flex items-center space-x-3">
        <div className="h-12 w-12 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
        <div>
          <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-2 animate-pulse"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-24 animate-pulse"></div>
        </div>
      </div>
    </div>

    {/* Messages Area Skeleton */}
    <div className="flex-1 p-4 space-y-6">
      {/* Incoming message skeleton */}
      <div className="flex space-x-3">
        <div className="h-10 w-10 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16 animate-pulse"></div>
          <div className="h-16 bg-gray-300 dark:bg-gray-600 rounded-lg w-3/4 animate-pulse"></div>
        </div>
      </div>

      {/* Outgoing message skeleton */}
      <div className="flex space-x-3 justify-end">
        <div className="flex-1 space-y-2 max-w-3/4">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16 ml-auto animate-pulse"></div>
          <div className="h-16 bg-blue-200 dark:bg-blue-900 rounded-lg w-2/3 ml-auto animate-pulse"></div>
        </div>
        <div className="h-10 w-10 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
      </div>

      {/* Center loading spinner */}
      <div className="flex justify-center items-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p
            className={
              isDark ? "text-gray-400 text-sm" : "text-gray-600 text-sm"
            }
          >
            Loading messages...
          </p>
        </div>
      </div>
    </div>

    {/* Message Input Skeleton */}
    <div
      className={`p-4 border-t ${
        isDark ? "border-gray-700" : "border-gray-200"
      }`}
    >
      <div className="flex space-x-2">
        <div className="flex-1 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
        <div className="h-12 w-12 bg-gray-300 dark:bg-gray-600 rounded-lg animate-pulse"></div>
      </div>
    </div>
  </div>
);

export default ChatPage;
