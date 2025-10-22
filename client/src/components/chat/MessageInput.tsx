import React, { useEffect, useRef, useState } from "react";
import type { MessageInputProps } from "../../types/chat-container.types";
import EmojiPicker, { Theme } from "emoji-picker-react";
import type { EmojiClickData } from "emoji-picker-react";

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
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          emojiPickerRef.current &&
          !emojiPickerRef.current.contains(event.target as Node)
        ) {
          setShowEmojiPicker(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      onFileSelect(file);
      if (e.target) {
        e.target.value = "";
      }
    };

    const handleEmojiClick = (emojiData: EmojiClickData) => {
      onMessageChange(newMessage + emojiData.emoji);
      setShowEmojiPicker(false);
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (newMessage.trim() && !isSending) {
          const mockEvent = {
            preventDefault: () => {},
          } as React.FormEvent<HTMLFormElement>;
          onSendMessage(mockEvent);
        }
      }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      onSendMessage(e);
    };

    return (
      <div
        className={`border-t px-4 md:px-6 py-4 ${
          isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div
            ref={emojiPickerRef}
            className="absolute bottom-8 left-4 md:left-[340px] z-50"
          >
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              theme={isDark ? Theme.DARK : Theme.LIGHT}
              height={400}
              width={300}
            />
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Emoji Button */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${
                isDark ? "text-gray-300" : "text-gray-600"
              } ${showEmojiPicker ? "bg-gray-200 dark:bg-gray-600" : ""}`}
              aria-label="Add emoji"
              title="Add emoji"
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
                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>

            {/* File Attachment Button */}
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

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              className="hidden cursor-pointer"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
            />

            {/* Message Input */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => onMessageChange(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={placeholder}
                disabled={isSending}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                }`}
              />
            </div>

            {/* Send Button */}
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
