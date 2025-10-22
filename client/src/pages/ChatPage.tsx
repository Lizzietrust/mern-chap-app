import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "../contexts/theme";
import { Layout } from "../components/Layout";
import { useSocket } from "../hooks/useSocket";
import { useMessages } from "../hooks/chats";
import { isChannelChat } from "../types/types";

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

export function ChatPage() {
  const { isDark } = useTheme();

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

  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [showChannelSettings, setShowChannelSettings] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  const { data: messages, isLoading: messagesLoading } = useMessages(
    selectedChat?._id
  );

  const currentChatRoomRef = useRef<string | null>(null);

  const usersPerPage = 10;
  const totalPages = Math.ceil((usersData?.totalUsers || 0) / usersPerPage);

  useEffect(() => {
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

  const handleSelectUser = useCallback(
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
            channels={separatedChannelChats}
            setSelectedChat={setSelectedChat}
            currentPage={currentPage}
            totalUsers={usersData?.totalUsers || 0}
            onPageChange={handlePageChange}
            onSearch={handleSearch}
            isLoadingUsers={isLoadingUsers || isCreatingChat}
            searchTerm={searchTerm}
            onCreateChannel={() => setShowCreateChannelModal(true)}
            onShowChannelSettings={() => setShowChannelSettings(true)}
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
            onShowChannelSettings={() => setShowChannelSettings(true)}
            stateUser={user}
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

const LoginRequired: React.FC<{ isDark: boolean }> = ({ isDark }) => (
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

const LoadingState: React.FC<{ isDark: boolean }> = ({ isDark }) => (
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

const LoadingSidebar: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <div
    className={`flex items-center justify-center w-80 ${
      isDark ? "text-white" : "text-black"
    }`}
  >
    <div>Loading chats...</div>
  </div>
);

const LoadingMessages: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <div
    className={`flex-1 flex items-center justify-center ${
      isDark ? "text-white" : "text-black"
    }`}
  >
    <div>Loading messages...</div>
  </div>
);

export default ChatPage;
