import { useRef } from "react";
import type { Message, ChatOrNull } from "../../types";
import { useApp } from "../../contexts/AppContext";
import { isChannelChat } from "../../types";
import { useSocket } from "../../contexts/useSocket";

interface Props {
  selectedChat: ChatOrNull;
  isDark: boolean;
  setSelectedChat: (chat: ChatOrNull) => void;
  getChatTitle: () => string;
  messages: Message[];
  formatTime: (timestamp: Date | string) => string;
  isTyping: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  handleSendMessage: (e: React.FormEvent<HTMLFormElement>) => void;
  handleFileSelect: (file: File) => void;
  newMessage: string;
  setNewMessage: (message: string) => void;
  isSending?: boolean;
  onShowChannelSettings: () => void;
}

const ChatContainer = ({
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
}: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { state } = useApp();
  const { onlineUsers } = useSocket();

  const isChannel = selectedChat && isChannelChat(selectedChat);
  // const isAdmin =
  //   isChannel && selectedChat.admins.includes(state.user?._id || "");

  const getSenderName = (message: Message): string => {
    if (typeof message.sender === "object") {
      return (
        message.sender.name ||
        `${message.sender.firstName || ""} ${
          message.sender.lastName || ""
        }`.trim() ||
        message.sender.email ||
        "Unknown User"
      );
    }
    return "Unknown User";
  };

  // In ChatContainer, add this function:
  const getChatSubtitle = (): string => {
    if (!selectedChat) return "";

    if (selectedChat.type === "channel") {
      return `${selectedChat.members?.length || 0} members • ${
        selectedChat.isPrivate ? "Private" : "Public"
      }`;
    }

    if (selectedChat.type === "direct") {
      const otherUser = selectedChat.participants?.find(
        (p) => p._id !== state.user?._id
      );

      if (otherUser) {
        // Get the latest online status from socket context
        const onlineUser = onlineUsers.find((u) => u._id === otherUser._id);
        const isOnline = onlineUser?.isOnline || false;
        const lastSeen = onlineUser?.lastSeen || otherUser.lastSeen;

        console.log("🔍 ChatContainer Subtitle Debug:", {
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

  const shouldShowSenderName = (message: Message, index: number): boolean => {
    if (!isChannel) return false;

    const isCurrentUser =
      (typeof message.sender === "object" &&
        message.sender._id === state?.user?._id) ||
      message.sender === state?.user?._id;

    if (isCurrentUser) return false;

    if (index === 0) return true;

    const prevMessage = messages[index - 1];
    const prevSenderId =
      typeof prevMessage.sender === "object"
        ? prevMessage.sender._id
        : prevMessage.sender;
    const currentSenderId =
      typeof message.sender === "object" ? message.sender._id : message.sender;

    return prevSenderId !== currentSenderId;
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    handleFileSelect(file);

    if (e.target) {
      e.target.value = "";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const extractFileName = (content: string): string => {
    const match = content.match(/📎 (.+?) \(/);
    return match ? match[1] : content;
  };

  const extractFileSize = (content: string): string => {
    const match = content.match(/\(([^)]+)\)/);
    return match ? match[1] : "";
  };

  console.log({ messages });

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = fileName || "download";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
      // Fallback: open in new tab
      window.open(fileUrl, "_blank");
    }
  };

  const handleMenuClick = () => {
    const options = [
      { label: "👥 View Participants", action: handleParticipantsClick },
      { label: "🔔 Notification Settings", action: handleNotificationsClick },
      { label: "⚙️ Chat Settings", action: handleSettingsClick },
      { label: "⚙️ Calls", action: handleSettingsClick },
    ];

    // Show dropdown menu with these options
    alert(
      "More options:\n• View Participants\n• Notification Settings\n• Chat Settings"
    );
  };

  // Separate handlers for each icon
  const handleParticipantsClick = () => {
    if (isChannel) {
      // Show channel members modal
      alert(
        "Channel Members:\n• View all members\n• See online status\n• Manage roles\n• Add/remove members"
      );
    } else {
      // Show DM participant info
      const otherUser = selectedChat.participants?.find(
        (p) => p._id !== state.user?._id
      );
      alert(
        `Chat with: ${otherUser?.firstName} ${otherUser?.lastName}\n\n• View profile\n• Shared media\n• Common groups`
      );
    }
  };

  const handleNotificationsClick = () => {
    if (isChannel) {
      alert(
        "Channel Notifications:\n• Mute channel\n• Custom notification sounds\n• Mention preferences"
      );
    } else {
      alert(
        "Chat Notifications:\n• Mute conversation\n• Custom alerts\n• Do Not Disturb"
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
      // User-level settings
      alert(
        "User Settings:\n• Account preferences\n• Theme and appearance\n• Privacy controls\n• Security settings"
      );
      return;
    }

    if (isChannel) {
      // Channel settings (admin/mod features)
      onShowChannelSettings(); // Your existing function
    } else {
      // DM chat settings
      alert(
        "Chat Settings:\n• Change chat theme\n• Clear chat history\n• Export chat\n• Block user\n• Delete chat"
      );
    }
  };

  return (
    <div
      className={`${selectedChat ? "flex" : "hidden md:flex"} flex-1 flex-col`}
    >
      {selectedChat ? (
        <>
          {/* Chat Header */}
          <div
            className={`border-b px-4 md:px-6 py-4 ${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSelectedChat(null)}
                  className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 md:hidden ${
                    isDark ? "text-gray-300" : "text-gray-600"
                  }`}
                  aria-label="Back to conversations"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                </button>
                <div className="flex items-center space-x-3">
                  {isChannel && (
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        selectedChat.isPrivate
                          ? "bg-orange-500"
                          : "bg-green-500"
                      } text-white font-semibold`}
                    >
                      {selectedChat.isPrivate ? "🔒" : "#"}
                    </div>
                  )}
                  <div>
                    <h1
                      className={`text-lg md:text-xl font-bold ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {getChatTitle()}
                    </h1>
                    <p
                      className={`text-sm ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {getChatSubtitle()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1 md:space-x-2">
                {/* Search - Most frequently used */}
                <button onClick={handleSearchClick} title="Search messages">
                  🔍
                </button>

                {/* Menu - Combines participants, notifications, settings */}
                <button onClick={handleMenuClick} title="More options">
                  ⋮
                </button>
              </div>
            </div>
          </div>

          {/* Messages Container */}
          <div className="overflow-y-auto h-[calc(100vh-120px)] p-4 space-y-2">
            {!messages || messages?.length === 0 ? (
              <div
                className={`text-center py-8 ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                <div className="text-4xl mb-4">{isChannel ? "🏗️" : "💬"}</div>
                <p className="text-lg font-medium mb-2">
                  {isChannel
                    ? "No messages in this channel yet"
                    : "No messages yet"}
                </p>
                <p>
                  {isChannel
                    ? "Send a message to start the conversation!"
                    : "Start the conversation!"}
                </p>
              </div>
            ) : (
              messages.map((message, index) => {
                const isCurrentUser =
                  (typeof message.sender === "object" &&
                    message.sender._id === state?.user?._id) ||
                  message.sender === state?.user?._id;

                const showSenderName = shouldShowSenderName(message, index);

                const isTempMessage =
                  (message._id && message._id.startsWith("temp-")) ||
                  message.isOptimistic === true;

                return (
                  <div
                    key={message._id}
                    className={`flex ${
                      isCurrentUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`
          max-w-xs lg:max-w-md px-4 py-2 rounded-lg transition-all duration-300
          ${
            isCurrentUser
              ? "bg-blue-500 text-white"
              : isDark
              ? "bg-gray-700 text-white"
              : "bg-white text-gray-900 border border-gray-200"
          }
          ${message.isOptimistic ? "opacity-70 blur-[0.5px]" : ""}
          ${message.isSending ? "opacity-80" : ""}
          ${
            message.failed
              ? "opacity-70 bg-red-100 border border-red-300 dark:bg-red-900/20 dark:border-red-700"
              : ""
          }
          ${
            !message.isOptimistic && !message.failed
              ? "opacity-100 blur-none"
              : ""
          }
        `}
                    >
                      {showSenderName && (
                        <p
                          className={`text-xs font-medium mb-1 ${
                            isDark ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {getSenderName(message)}
                        </p>
                      )}

                      <div className="text-sm break-words">
                        {message.messageType === "image" ? (
                          <div className="max-w-xs">
                            <img
                              src={message.fileUrl || message.content}
                              alt={message.fileName || "Shared image"}
                              className="rounded-lg max-w-full h-auto cursor-pointer"
                              onClick={() => {
                                if (message.fileUrl) {
                                  window.open(message.fileUrl, "_blank");
                                }
                              }}
                            />
                            <div className="mt-2 flex space-x-2">
                              <button
                                onClick={() =>
                                  handleDownload(
                                    message.fileUrl,
                                    message.fileName || "image"
                                  )
                                }
                                className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
                              >
                                Download
                              </button>
                              <button
                                onClick={() =>
                                  window.open(message.fileUrl, "_blank")
                                }
                                className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600 transition-colors"
                              >
                                Open
                              </button>
                            </div>
                          </div>
                        ) : message.messageType === "file" ? (
                          <div className="flex items-center space-x-2 p-2 bg-opacity-20 rounded">
                            <span className="text-lg">📎</span>
                            <div className="flex-1">
                              <p className="font-medium">
                                {message.fileName ||
                                  extractFileName(message.content)}
                              </p>
                              <p className="text-xs opacity-75">
                                {message.fileSize
                                  ? formatFileSize(message.fileSize)
                                  : extractFileSize(message.content)}
                              </p>
                              <div className="mt-2 flex space-x-2">
                                <button
                                  onClick={() =>
                                    handleDownload(
                                      message.fileUrl,
                                      message.fileName || "file"
                                    )
                                  }
                                  className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
                                >
                                  Download
                                </button>
                                <button
                                  onClick={() =>
                                    window.open(message.fileUrl, "_blank")
                                  }
                                  className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600 transition-colors"
                                >
                                  Open
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          message.content || message.text
                        )}
                      </div>

                      <p
                        className={`text-xs mt-1 text-right ${
                          isCurrentUser
                            ? "text-blue-100"
                            : isDark
                            ? "text-gray-400"
                            : "text-gray-500"
                        }`}
                      >
                        {message.createdAt && formatTime(message.createdAt)}
                        {isTempMessage && <span className="ml-1">⏳</span>}
                        {message.failed && <span className="ml-1">❌</span>}
                      </p>
                    </div>
                  </div>
                );
              })
            )}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    isDark
                      ? "bg-gray-700 text-white"
                      : "bg-white text-gray-900 border border-gray-200"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <span
                      className={`text-xs ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      typing...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div
            className={`border-t px-4 md:px-6 py-4 ${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <form onSubmit={handleSendMessage}>
              <div className="flex items-center space-x-2 md:space-x-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  className="hidden cursor-pointer"
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${
                    isDark ? "text-gray-300" : "text-gray-600"
                  }`}
                  aria-label="Attach file"
                  title="Attach file"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                    />
                  </svg>
                </button>
                <div className="flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={`Message ${getChatTitle()}`}
                    disabled={isSending}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isDark
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                    }`}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newMessage.trim() || isSending}
                  className="px-4 md:px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-2"
                >
                  {isSending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="hidden md:inline">Sending...</span>
                    </>
                  ) : (
                    "Send"
                  )}
                </button>
              </div>
            </form>
          </div>
        </>
      ) : (
        <div
          className={`flex-1 items-center justify-center ${
            isDark ? "text-gray-400" : "text-gray-500"
          } hidden md:flex`}
        >
          <div className="text-center">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-xl font-semibold mb-2">
              Select a conversation
            </h3>
            <p>Choose a chat from the sidebar to start messaging</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatContainer;
