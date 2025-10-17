import React from "react";
import type { ChatHeaderProps } from "../../types/chat-container.types";

const ChatHeader: React.FC<ChatHeaderProps> = React.memo(
  ({
    selectedChat,
    isDark,
    onBack,
    title,
    subtitle,
    onSearch,
    onMenu,
    // onParticipants,
  }) => {
    const isChannel = selectedChat?.type === "channel";

    return (
      <div
        className={`border-b px-4 md:px-6 py-4 ${
          isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
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
                    selectedChat.isPrivate ? "bg-orange-500" : "bg-green-500"
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
                  {title}
                </h1>
                <p
                  className={`text-sm ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {subtitle}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1 md:space-x-2">
            <button onClick={onSearch} title="Search messages" className="p-2">
              🔍
            </button>
            <button onClick={onMenu} title="More options" className="p-2">
              ⋮
            </button>
          </div>
        </div>
      </div>
    );
  }
);

ChatHeader.displayName = "ChatHeader";

export default ChatHeader;
