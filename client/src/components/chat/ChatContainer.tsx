import { useRef } from "react";
import type { Message, Chat } from "../../types";
import { useApp } from "../../contexts/AppContext";

interface Props {
  selectedChat: Chat;
  isDark: boolean;
  setSelectedChat: (chat: Chat | null) => void;
  getChatTitle: () => string;
  getChatSubtitle: () => string;
  messages: Message[];
  formatTime: (timestamp: Date | string) => string;
  isTyping: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  handleSendMessage: (e: React.FormEvent<HTMLFormElement>) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  newMessage: string;
  setNewMessage: (message: string) => void;
  isSending?: boolean;
}

const ChatContainer = ({
  selectedChat,
  isDark,
  setSelectedChat,
  getChatTitle,
  getChatSubtitle,
  messages,
  formatTime,
  isTyping,
  messagesEndRef,
  handleSendMessage,
  handleFileSelect,
  newMessage,
  setNewMessage,
  isSending = false,
}: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { state } = useApp();

  console.log({ messages });

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
                <div>
                  <h1
                    className={`text-lg md:text-xl font-bold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {state?.user?.name}
                    {/* {getChatTitle()} */}
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
              <div className="flex items-center space-x-1 md:space-x-2">
                <button
                  className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${
                    isDark ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  📞
                </button>
                <button
                  className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${
                    isDark ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  🎥
                </button>
                <button
                  className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${
                    isDark ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  ⚙️
                </button>
              </div>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!messages || messages.length === 0 ? (
              <div
                className={`text-center py-8 ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                <div className="text-4xl mb-4">💬</div>
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => {
                const isCurrentUser =
                  message.sender === state.user._id ||
                  (typeof message.sender === "object" &&
                    message.sender._id === state.user._id);

                return (
                  <div
                    key={message._id || message.id}
                    className={`flex ${
                      isCurrentUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        isCurrentUser
                          ? "bg-blue-500 text-white"
                          : isDark
                          ? "bg-gray-700 text-white"
                          : "bg-white text-gray-900 border border-gray-200"
                      } ${message.id?.startsWith("temp-") ? "opacity-70" : ""}`}
                    >
                      <p className="text-sm break-words">
                        {message.content || message.text}
                      </p>
                      <p
                        className={`text-xs mt-1 text-right ${
                          isCurrentUser
                            ? "text-blue-100"
                            : isDark
                            ? "text-gray-400"
                            : "text-gray-500"
                        }`}
                      >
                        {formatTime(message?.createdAt || message?.timestamp)}
                        {message.id?.startsWith("temp-") && (
                          <span className="ml-1">⏳</span>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })
            )}

            {isTyping && (
              <div className="flex justify-start">
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    isDark
                      ? "bg-gray-700 text-white"
                      : "bg-white text-gray-900 border border-gray-200"
                  }`}
                >
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
                  onChange={handleFileSelect}
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
