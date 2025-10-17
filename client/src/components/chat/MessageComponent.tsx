import React from "react";
import type { MessageDisplayProps } from "../../types/chat-container.types";
import {
//   isTextMessage,
//   isFileMessage,
  isOptimisticMessage,
  isFailedMessage,
  isSendingMessage,
  getMessageContent,
  getMessageFileUrl,
  getMessageFileName,
  getMessageFileSize,
} from "../../types/types";
import {
  formatFileSize,
  extractFileName,
  extractFileSize,
} from "../../utils/chat-container.utils";

const MessageComponent: React.FC<MessageDisplayProps> = React.memo(
  ({
    message,
    isCurrentUser,
    showSenderName,
    senderName,
    isDark,
    formatTime,
    onDownloadFile,
  }) => {
    const isTempMessage = isOptimisticMessage(message);
    const isFailed = isFailedMessage(message);
    const isSending = isSendingMessage(message);

    const renderMessageContent = () => {
      const messageType = message.messageType;
      const fileUrl = getMessageFileUrl(message);
      const fileName = getMessageFileName(message);
      const fileSize = getMessageFileSize(message);
      const content = getMessageContent(message);

      switch (messageType) {
        case "image":
          return (
            <div className="max-w-xs">
              <img
                src={fileUrl}
                alt={fileName}
                className="rounded-lg max-w-full h-auto cursor-pointer"
                onClick={() => fileUrl && window.open(fileUrl, "_blank")}
              />
              <div className="mt-2 flex space-x-2">
                <button
                  onClick={() => onDownloadFile(fileUrl, fileName)}
                  className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
                >
                  Download
                </button>
                <button
                  onClick={() => window.open(fileUrl, "_blank")}
                  className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600 transition-colors"
                >
                  Open
                </button>
              </div>
            </div>
          );

        case "file":
        case "audio":
        case "video":
          return (
            <div className="flex items-center space-x-2 p-2 bg-opacity-20 rounded">
              <span className="text-lg">
                {messageType === "audio"
                  ? "🎵"
                  : messageType === "video"
                  ? "🎬"
                  : "📎"}
              </span>
              <div className="flex-1">
                <p className="font-medium">
                  {fileName || extractFileName(content)}
                </p>
                <p className="text-xs opacity-75">
                  {fileSize
                    ? formatFileSize(fileSize)
                    : extractFileSize(content)}
                </p>
                <div className="mt-2 flex space-x-2">
                  <button
                    onClick={() => onDownloadFile(fileUrl, fileName)}
                    className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => window.open(fileUrl, "_blank")}
                    className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600 transition-colors"
                  >
                    Open
                  </button>
                </div>
              </div>
            </div>
          );

        case "text":
        default:
          return content;
      }
    };

    const getMessageStyles = () => {
      const baseStyles = `
        max-w-xs lg:max-w-md px-4 py-2 rounded-lg transition-all duration-300
        ${
          isCurrentUser
            ? "bg-blue-500 text-white"
            : isDark
            ? "bg-gray-700 text-white"
            : "bg-white text-gray-900 border border-gray-200"
        }
      `;

      const stateStyles = `
        ${isTempMessage ? "opacity-70 blur-[0.5px]" : ""}
        ${isSending ? "opacity-80" : ""}
        ${
          isFailed
            ? "opacity-70 bg-red-100 border border-red-300 dark:bg-red-900/20 dark:border-red-700"
            : ""
        }
        ${!isTempMessage && !isFailed ? "opacity-100 blur-none" : ""}
      `;

      return `${baseStyles} ${stateStyles}`;
    };

    return (
      <div
        className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
      >
        <div className={getMessageStyles()}>
          {showSenderName && (
            <p
              className={`text-xs font-medium mb-1 ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              {senderName}
            </p>
          )}

          <div className="text-sm break-words">{renderMessageContent()}</div>

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
            {isFailed && <span className="ml-1">❌</span>}
            {isSending && !isTempMessage && <span className="ml-1">↻</span>}
          </p>
        </div>
      </div>
    );
  }
);

MessageComponent.displayName = "MessageComponent";

export default MessageComponent;
