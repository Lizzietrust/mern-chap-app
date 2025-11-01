import React, { useMemo, useState, useEffect } from "react";
import { useApp } from "../../contexts/appcontext/index";
import { useChatSubtitle } from "../../hooks/useChatSubtitle";
import { isChannelChat, getUserId, type User } from "../../types/types";
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
import { useSocket } from "../../hooks/useSocket";
import { useClearChat } from "../../hooks/chats/useClearchat";
import ChatSettingsModal from "../modals/ChatSettingsModal";
import ClearChatModal from "../modals/ClearChatModal";

interface MessageStatusUpdateData {
  messageId: string;
  status: "sent" | "delivered" | "read";
  readBy?: string[] | User[];
  chatId: string;
}

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
  const { socket, onlineUsers } = useSocket();
  const clearChatMutation = useClearChat();

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showClearChatModal, setShowClearChatModal] = useState(false);

  console.log({ messages });

  const safeOnlineUsers = useMemo(() => {
    return Array.isArray(onlineUsers) ? onlineUsers : [];
  }, [onlineUsers]);

  const displayChat = useMemo(() => {
    if (!selectedChat) return null;

    if (selectedChat.type === "direct" && selectedChat.participants) {
      return {
        ...selectedChat,
        participants: selectedChat.participants.map((p) => {
          const onlineUser = safeOnlineUsers.find(
            (u) => u._id === getUserId(p)
          );
          return {
            ...p,
            isOnline:
              onlineUser?.isOnline ||
              (typeof p === "object" ? p.isOnline : false) ||
              false,
            lastSeen:
              onlineUser?.lastSeen ||
              (typeof p === "object" ? p.lastSeen : undefined),
          };
        }),
      };
    }

    return selectedChat;
  }, [selectedChat, safeOnlineUsers]);

  const { chatSubtitle } = useChatSubtitle({
    showLastSeen: true,
    timeFormat: "12h",
  });

  const isChannel = selectedChat && isChannelChat(selectedChat);
  const isAdmin = isChannel && selectedChat!.admins?.includes(state.user!._id);
  const isCreator = isChannel && selectedChat!.createdBy === state.user!._id;

  const subtitle = chatSubtitle(displayChat, state.user);

  useEffect(() => {
    if (!socket || !selectedChat) return;

    socket.emit("joinChat", selectedChat._id);

    const handleMessageStatusUpdate = (data: MessageStatusUpdateData) => {
      console.log("📢 Received message status update:", data);
    };

    socket.on("messageStatusUpdate", handleMessageStatusUpdate);

    const markMessagesAsDelivered = async () => {
      if (messages && messages.length > 0) {
        const undeliveredMessages = messages.filter((msg) => {
          const senderId =
            typeof msg.sender === "object" ? msg.sender._id : msg.sender;
          return senderId !== state.user?._id && msg.status === "sent";
        });

        for (const message of undeliveredMessages) {
          try {
            socket.emit("markAsDelivered", {
              messageId: message._id,
              userId: state.user?._id,
            });
          } catch (error) {
            console.error("Error marking message as delivered:", error);
          }
        }
      }
    };

    markMessagesAsDelivered();

    return () => {
      socket.off("messageStatusUpdate", handleMessageStatusUpdate);
      socket.emit("leaveChat", selectedChat._id);
    };
  }, [socket, selectedChat, state.user, messages]);

  useEffect(() => {
    if (!socket || !selectedChat || !messages || messages.length === 0) return;

    const messageContainer = document.querySelector(".overflow-y-auto");
    const isAtBottom = messageContainer
      ? messageContainer.scrollHeight - messageContainer.scrollTop <=
        messageContainer.clientHeight + 100
      : false;

    if (isAtBottom) {
      const unreadMessages = messages.filter((msg) => {
        const senderId =
          typeof msg.sender === "object" ? msg.sender._id : msg.sender;
        return senderId !== state.user?._id && msg.status !== "read";
      });

      if (unreadMessages.length > 0) {
        console.log(`👁️ Marking ${unreadMessages.length} messages as read`);

        socket.emit("markAllMessagesAsRead", {
          chatId: selectedChat._id,
          userId: state.user?._id,
        });
      }
    }
  }, [messages, selectedChat, state.user, socket]);

  useEffect(() => {
    if (!socket || !messages || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];

    if (lastMessage) {
      const senderId =
        typeof lastMessage.sender === "object"
          ? lastMessage.sender._id
          : lastMessage.sender;

      if (senderId !== state.user?._id && lastMessage.status === "sent") {
        console.log(
          "📨 Marking received message as delivered:",
          lastMessage._id
        );

        socket.emit("markAsDelivered", {
          messageId: lastMessage._id,
          userId: state.user?._id,
        });
      }
    }
  }, [messages, state.user, socket]);

  useEffect(() => {
    if (!socket || !selectedChat || !messages || messages.length === 0) return;

    const handleFocus = () => {
      const undeliveredMessages = messages.filter((msg) => {
        const senderId =
          typeof msg.sender === "object" ? msg.sender._id : msg.sender;
        return senderId !== state.user?._id && msg.status === "sent";
      });

      if (undeliveredMessages.length > 0) {
        console.log(
          `📨 Marking ${undeliveredMessages.length} messages as delivered on focus`
        );

        undeliveredMessages.forEach((message) => {
          socket.emit("markAsDelivered", {
            messageId: message._id,
            userId: state.user?._id,
          });
        });
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    handleFocus();

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [socket, selectedChat, messages, state.user]);

  const handleDownloadFile = async (fileUrl: string, fileName: string) => {
    await downloadFile(fileUrl, fileName);
  };

  const handleMenuClick = () => {
    setShowSettingsModal(true);
  };

  const handleSettingsOptionSelect = (option: string) => {
    setShowSettingsModal(false);

    switch (option) {
      case "clear":
        setShowClearChatModal(true);
        break;
      case "theme":
        alert("Change chat theme functionality would go here");
        break;
      case "export":
        alert("Export chat functionality would go here");
        break;
      case "block":
        alert("Block user functionality would go here");
        break;
      case "delete":
        alert("Delete chat functionality would go here");
        break;
      default:
        break;
    }
  };

  const handleClearChatConfirm = (deleteForEveryone: boolean) => {
    setShowClearChatModal(false);

    if (selectedChat) {
      clearChatMutation.mutate({
        chatId: selectedChat._id,
        deleteForEveryone,
      });
    }
  };

  const handleParticipantsClick = () => {
    if (!displayChat) return;

    if (isChannelChat(displayChat)) {
      alert(
        `Channel Members: ${
          displayChat.members?.length || 0
        } members\n\n• View all members\n• See online status\n• Manage roles\n• Add/remove members`
      );
    } else if (displayChat.type === "direct" && displayChat.participants) {
      const otherUser = displayChat.participants.find(
        (p) => getUserId(p) !== state.user?._id
      );

      if (otherUser) {
        const otherUserName =
          typeof otherUser === "string"
            ? "Unknown User"
            : `${otherUser.firstName} ${otherUser.lastName}`;

        const isOnline =
          typeof otherUser === "object" ? otherUser.isOnline : false;

        alert(
          `Chat with: ${otherUserName}\n\nStatus: ${
            isOnline ? "Online" : "Offline"
          }\n\n• View profile\n• Shared media\n• Common groups`
        );
      }
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
      setShowSettingsModal(true);
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
      const isCurrentUser = getUserId(message.sender) === state?.user?._id;

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
          socket={socket || undefined}
          currentUser={state.user}
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
    <>
      <div className="flex flex-1 flex-col">
        <ChatHeader
          selectedChat={selectedChat}
          isDark={isDark}
          onBack={() => setSelectedChat(null)}
          title={getChatTitle()}
          subtitle={subtitle}
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

      <ChatSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        isChannel={isChannel}
        onOptionSelect={handleSettingsOptionSelect}
        isDark={isDark}
      />

      <ClearChatModal
        isOpen={showClearChatModal}
        onClose={() => setShowClearChatModal(false)}
        onConfirm={handleClearChatConfirm}
        isDark={isDark}
        isChannel={isChannel}
        isAdmin={isAdmin}
        isCreator={isCreator}
      />
    </>
  );
};

export default React.memo(ChatContainer);
