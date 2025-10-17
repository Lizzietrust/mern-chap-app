import React, { useRef } from "react";
import type { MessageInputProps } from "../../types/chat-container.types";

const MessageInput: React.FC<MessageInputProps> = React.memo(
  ({
    newMessage,
    isSending,
    isDark,
    placeholder,
    onMessageChange,
    onSendMessage,
    onFileSelect,
  }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      onFileSelect(file);
      if (e.target) {
        e.target.value = "";
      }
    };

    return (
      <div
        className={`border-t px-4 md:px-6 py-4 ${
          isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        <form onSubmit={onSendMessage}>
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
                type="text"
                value={newMessage}
                onChange={(e) => onMessageChange(e.target.value)}
                placeholder={placeholder}
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
    );
  }
);

MessageInput.displayName = "MessageInput";

export default MessageInput;
