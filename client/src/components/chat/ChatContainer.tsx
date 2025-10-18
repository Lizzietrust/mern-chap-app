import React, { useMemo } from "react";
import { useApp } from "../../contexts/appcontext/index";
import { useSocket } from "../../hooks/useSocket";
import { isChannelChat, isDirectChat } from "../../types/types";
import type { ChatContainerProps } from "../../types/chat-container.types";
import {
  getSenderName,
  shouldShowSenderName,
  downloadFile,
} from "../../utils/chat-container.utils";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageComponent from "./MessageComponent";
import TypingIndicator from "./TypingIndicator";

const ChatContainer: React.FC<ChatContainerProps> = ({
  selectedChat,
  isDark,
  setSelectedChat,
  getChatTitle,
  messages,
  formatTime,
  isTyping,
  messagesEndRef,
  handleSendMessage,
  handleFileSelect,
  newMessage,
  setNewMessage,
  isSending = false,
  onShowChannelSettings,
}) => {
  const { state } = useApp();
  const { onlineUsers } = useSocket();

  const isChannel = selectedChat && isChannelChat(selectedChat);
  // const isDirect = selectedChat && isDirectChat(selectedChat);

  const chatSubtitle = useMemo(() => {
    if (!selectedChat) return "";

    if (isChannelChat(selectedChat)) {
      return `${selectedChat.members?.length || 0} members • ${
        selectedChat.isPrivate ? "Private" : "Public"
      }`;
    }

    if (isDirectChat(selectedChat)) {
      const otherUser = selectedChat.participants?.find(
        (p) => p._id !== state.user?._id
      );

      if (otherUser) {
        const onlineUser = onlineUsers.find((u) => u._id === otherUser._id);
        const isOnline = onlineUser?.isOnline || false;
        const lastSeen = onlineUser?.lastSeen || otherUser.lastSeen;

        if (isOnline) return "Online";
        if (lastSeen) return `Last seen ${formatTime(lastSeen)}`;
        return "Offline";
      }
    }

    return "";
  }, [selectedChat, state.user?._id, onlineUsers, formatTime]);

  const handleDownloadFile = async (fileUrl: string, fileName: string) => {
    await downloadFile(fileUrl, fileName);
  };

  const handleMenuClick = () => {
    alert(
      "More options:\n• View Participants\n• Notification Settings\n• Chat Settings"
    );
  };

  const handleParticipantsClick = () => {
    if (!selectedChat) return;

    if (isChannelChat(selectedChat)) {
      alert(
        `Channel Members: ${
          selectedChat.members?.length || 0
        } members\n\n• View all members\n• See online status\n• Manage roles\n• Add/remove members`
      );
    } else if (isDirectChat(selectedChat)) {
      const otherUser = selectedChat.participants?.find(
        (p) => p._id !== state.user?._id
      );
      alert(
        `Chat with: ${otherUser?.firstName} ${otherUser?.lastName}\n\n• View profile\n• Shared media\n• Common groups`
      );
    }
  };

  const handleSearchClick = () => {
    alert(
      "Search in this conversation\n\n• Search by keyword\n• Filter by date\n• Find files and links"
    );
  };

  const handleSettingsClick = () => {
    if (!selectedChat) {
      alert(
        "User Settings:\n• Account preferences\n• Theme and appearance\n• Privacy controls\n• Security settings"
      );
      return;
    }

    if (isChannelChat(selectedChat)) {
      onShowChannelSettings();
    } else {
      alert(
        "Chat Settings:\n• Change chat theme\n• Clear chat history\n• Export chat\n• Block user\n• Delete chat"
      );
    }
  };

  const renderMessages = () => {
    if (!messages || messages.length === 0) {
      return (
        <div
          className={`text-center py-8 ${
            isDark ? "text-gray-400" : "text-gray-500"
          }`}
        >
          <div className="text-4xl mb-4">
            {selectedChat && isChannelChat(selectedChat) ? "🏗️" : "💬"}
          </div>
          <p className="text-lg font-medium mb-2">
            {selectedChat && isChannelChat(selectedChat)
              ? "No messages in this channel yet"
              : "No messages yet"}
          </p>
          <p>
            {selectedChat && isChannelChat(selectedChat)
              ? "Send a message to start the conversation!"
              : "Start the conversation!"}
          </p>
        </div>
      );
    }

    return messages.map((message, index) => {
      const isCurrentUser =
        (typeof message.sender === "object" &&
          message.sender._id === state?.user?._id) ||
        message.sender === state?.user?._id;

      const showSenderName = shouldShowSenderName(
        message,
        index,
        messages,
        !!isChannel,
        state?.user?._id
      );

      const senderName = getSenderName(message);

      return (
        <MessageComponent
          key={message._id}
          message={message}
          isCurrentUser={isCurrentUser}
          showSenderName={showSenderName}
          senderName={senderName}
          isDark={isDark}
          formatTime={formatTime}
          onDownloadFile={handleDownloadFile}
        />
      );
    });
  };

  if (!selectedChat) {
    return (
      <div
        className={`flex-1 items-center justify-center ${
          isDark ? "text-gray-400" : "text-gray-500"
        } hidden md:flex`}
      >
        <div className="text-center">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
          <p>Choose a chat from the sidebar to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <ChatHeader
        selectedChat={selectedChat}
        isDark={isDark}
        onBack={() => setSelectedChat(null)}
        title={getChatTitle()}
        subtitle={chatSubtitle}
        onSearch={handleSearchClick}
        onMenu={handleMenuClick}
        onParticipants={handleParticipantsClick}
        onSettings={handleSettingsClick}
      />

      <div className="overflow-y-auto h-[calc(100vh-120px)] p-4 space-y-2">
        {renderMessages()}

        {isTyping && <TypingIndicator isDark={isDark} />}

        <div ref={messagesEndRef} />
      </div>

      <MessageInput
        newMessage={newMessage}
        isSending={isSending}
        isDark={isDark}
        placeholder={`Message ${getChatTitle()}`}
        onMessageChange={setNewMessage}
        onSendMessage={handleSendMessage}
        onFileSelect={handleFileSelect}
      />
    </div>
  );
};

export default React.memo(ChatContainer);
