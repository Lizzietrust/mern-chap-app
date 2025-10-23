import React, { useEffect, useRef } from "react";
import type { MessageDisplayProps } from "../../types/chat-container.types";
import { MessageStatus } from "./MessageStatus";
import { useMarkMessageAsRead } from "../../hooks/chats";
import { useApp } from "../../contexts/appcontext/index";

const MessageComponent: React.FC<MessageDisplayProps> = ({
  message,
  isCurrentUser,
  showSenderName,
  senderName,
  isDark,
  formatTime,
  onDownloadFile,
}) => {
  const markAsReadMutation = useMarkMessageAsRead();
  const messageRef = useRef<HTMLDivElement>(null);
  const hasBeenReadRef = useRef(false);
  const { state } = useApp();

  useEffect(() => {
    const isUserInReadBy = message.readBy?.some((readByItem) => {
      if (typeof readByItem === "string") {
        return readByItem === state.user?._id;
      } else {
        return readByItem._id === state.user?._id;
      }
    });

    console.log(`🔍 Message ${message._id} debug:`, {
      status: message.status,
      isCurrentUser,
      isUserInReadBy,
      readByCount: message.readBy?.length,
      readBy: message.readBy,
      hasBeenReadRef: hasBeenReadRef.current,
    });

    if (
      isCurrentUser ||
      hasBeenReadRef.current ||
      message.status === "read" ||
      isUserInReadBy
    ) {
      console.log(`⏩ Skipping mark as read for message ${message._id}`);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasBeenReadRef.current) {
          console.log(`👁️ Marking message ${message._id} as read`);
          markAsReadMutation.mutate(message._id);
          hasBeenReadRef.current = true;
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    if (messageRef.current) {
      observer.observe(messageRef.current);
    }

    return () => observer.disconnect();
  }, [
    message._id,
    message.readBy,
    message.status,
    isCurrentUser,
    markAsReadMutation,
    state.user,
  ]);

  console.log({ message });

  const renderFileMessage = () => {
    if (message.messageType !== "file" || !message.fileUrl) {
      return <div>{message.content}</div>;
    }

    return (
      <div className="flex flex-col space-y-2">
        {message.content && <div>{message.content}</div>}
        <div
          className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
            isDark
              ? "bg-gray-700 hover:bg-gray-600"
              : "bg-gray-100 hover:bg-gray-200"
          }`}
          onClick={() =>
            onDownloadFile(message.fileUrl!, message.fileName || "file")
          }
        >
          <div className="flex-shrink-0">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isDark ? "bg-gray-600" : "bg-gray-200"
              }`}
            >
              <span className="text-lg">📎</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm font-medium truncate ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              {message.fileName}
            </p>
            {message.fileSize && (
              <p
                className={`text-xs ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {(message.fileSize / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
          </div>
          <div className="flex-shrink-0">
            <span className="text-blue-500 hover:text-blue-600 text-sm font-medium">
              Download
            </span>
          </div>
        </div>
      </div>
    );
  };

  const getSenderInfo = () => {
    if (typeof message.sender === "string") {
      return {
        image: null,
        initials: "?",
        firstName: "",
        lastName: "",
      };
    } else {
      return {
        image: message.sender.image,
        initials: `${message.sender.firstName?.[0] || ""} ${
          message.sender.lastName?.[0] || ""
        }`.trim(),
        firstName: message.sender.firstName,
        lastName: message.sender.lastName,
      };
    }
  };

  const senderInfo = getSenderInfo();

  return (
    <div
      className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} mb-4`}
    >
      <div
        className={`flex ${
          isCurrentUser ? "flex-row-reverse" : "flex-row"
        } items-end space-x-2 max-w-[70%]`}
      >
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium">
            {senderInfo.image ? (
              <img
                src={senderInfo.image}
                alt={senderName}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <span>{senderInfo.initials || "?"}</span>
            )}
          </div>
        </div>

        {/* Message Content */}
        <div
          className={`flex flex-col ${
            isCurrentUser ? "items-end" : "items-start"
          }`}
        >
          {/* Sender Name */}
          {showSenderName && !isCurrentUser && (
            <div className="flex items-center space-x-2 mb-1">
              <span
                className={`text-sm font-medium ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                {senderName}
              </span>
            </div>
          )}

          {/* Message Bubble */}
          <div
            className={`px-4 py-2 rounded-2xl ${
              isCurrentUser
                ? isDark
                  ? "bg-blue-600 text-white"
                  : "bg-blue-500 text-white"
                : isDark
                ? "bg-gray-700 text-white"
                : "bg-gray-200 text-gray-900"
            }`}
          >
            {message.messageType === "file"
              ? renderFileMessage()
              : message.content}
          </div>

          {/* Message Meta */}
          <div
            className={`flex items-center space-x-2 mt-1 ${
              isCurrentUser ? "flex-row-reverse space-x-reverse" : ""
            }`}
          >
            {/* Time */}
            <span
              className={`text-xs ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {formatTime(message.timestamp)}
            </span>

            {/* Status for current user's messages */}
            {isCurrentUser && (
              <MessageStatus
                status={message.status}
                readBy={message.readBy}
                isDark={isDark}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(MessageComponent);
