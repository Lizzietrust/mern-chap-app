import React, { useEffect, useRef, useState } from "react";
import type { MessageDisplayProps } from "../../types/chat-container.types";
import { MessageStatus } from "./MessageStatus";
import { useMarkMessageAsRead } from "../../hooks/chats";
import {
  useEditMessage,
  useDeleteMessage,
} from "../../hooks/chats/useMessageOperations";
import EmojiPicker, { Theme } from "emoji-picker-react";
import type { EmojiClickData } from "emoji-picker-react";
import { DeleteConfirmationModal } from "./DeleteConfirmationmodal";
import type { Socket } from "socket.io-client";
import type { User } from "../../types/types";

interface ExtendedMessageDisplayProps extends MessageDisplayProps {
  socket?: Socket;
  currentUser?: User | null;
}

const MessageComponent: React.FC<ExtendedMessageDisplayProps> = ({
  message,
  isCurrentUser,
  showSenderName,
  senderName,
  isDark,
  formatTime,
  onDownloadFile,
  socket,
  currentUser,
}) => {
  const markAsReadMutation = useMarkMessageAsRead();
  const messageRef = useRef<HTMLDivElement>(null);
  const hasBeenReadRef = useRef(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteForEveryone, setDeleteForEveryone] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const editMessageMutation = useEditMessage();
  const deleteMessageMutation = useDeleteMessage();

  useEffect(() => {
    if (!socket || !currentUser) return;

    const isUserInReadBy = message.readBy?.some((readByItem) => {
      if (typeof readByItem === "string") {
        return readByItem === currentUser._id;
      } else {
        return readByItem._id === currentUser._id;
      }
    });

    if (
      isCurrentUser ||
      hasBeenReadRef.current ||
      message.status === "read" ||
      isUserInReadBy
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasBeenReadRef.current && socket) {
          socket.emit("messageRead", {
            messageId: message._id,
            userId: currentUser._id,
          });

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
    currentUser,
    socket,
  ]);

  useEffect(() => {
    if (!socket || !currentUser || isCurrentUser || message.status !== "sent")
      return;

    const isUserInReadBy = message.readBy?.some((readByItem) => {
      if (typeof readByItem === "string") {
        return readByItem === currentUser._id;
      } else {
        return readByItem._id === currentUser._id;
      }
    });

    if (!isUserInReadBy) {
      socket.emit("messageDelivered", {
        messageId: message._id,
        userId: currentUser._id,
      });
    }
  }, [message, isCurrentUser, currentUser, socket]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node) &&
        !(event.target as Element)?.closest(".emoji-button")
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.setSelectionRange(
        editInputRef.current.value.length,
        editInputRef.current.value.length
      );
    }
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) {
      setEditContent(message.content);
    }
  }, [message.content, isEditing]);

  const canEditMessage = (): boolean => {
    if (!isCurrentUser) return false;
    if (message.isDeleted) return false;

    const editTimeLimit = 15 * 60 * 1000;
    const messageAge = Date.now() - new Date(message.createdAt).getTime();
    return messageAge <= editTimeLimit;
  };

  const canDeleteMessage = (): {
    deleteForMe: boolean;
    deleteForEveryone: boolean;
  } => {
    if (message.isDeleted) {
      return { deleteForMe: false, deleteForEveryone: false };
    }

    const deleteTimeLimit = 15 * 60 * 1000;
    const messageAge = Date.now() - new Date(message.createdAt).getTime();
    const canDeleteForEveryone = messageAge <= deleteTimeLimit;

    return {
      deleteForMe: isCurrentUser ?? false,
      deleteForEveryone: (isCurrentUser && canDeleteForEveryone) ?? false,
    };
  };

  const handleEdit = (): void => {
    setIsEditing(true);
    setEditContent(message.content);
    setShowMenu(false);
  };

  const handleSaveEdit = async (): Promise<void> => {
    if (!editContent?.trim() || editContent === message.content) {
      setIsEditing(false);
      return;
    }

    try {
      await editMessageMutation.mutateAsync({
        messageId: message._id,
        content: editContent,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to edit message:", error);
    }
  };

  const handleCancelEdit = (): void => {
    setIsEditing(false);
    setEditContent(message.content);
    setShowEmojiPicker(false);
  };

  const handleDeleteClick = (forEveryone: boolean): void => {
    setDeleteForEveryone(forEveryone);
    setShowDeleteModal(true);
    setShowMenu(false);
  };

  const handleDeleteConfirm = async (): Promise<void> => {
    try {
      await deleteMessageMutation.mutateAsync({
        messageId: message._id,
        deleteForEveryone,
      });
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ): void => {
    setEditContent(e.target.value);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>): void => {
    const pastedText = e.clipboardData.getData("text");
    if (pastedText) {
      setTimeout(() => {
        if (editInputRef.current) {
          setEditContent(editInputRef.current.value);
        }
      }, 0);
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData): void => {
    const cursorPosition = editInputRef.current?.selectionStart || 0;
    const textBeforeCursor = editContent?.substring(0, cursorPosition) || "";
    const textAfterCursor = editContent?.substring(cursorPosition) || "";

    const newContent = textBeforeCursor + emojiData.emoji + textAfterCursor;
    setEditContent(newContent);

    setTimeout(() => {
      if (editInputRef.current) {
        editInputRef.current.focus();
        const newCursorPosition = cursorPosition + emojiData.emoji.length;
        editInputRef.current.setSelectionRange(
          newCursorPosition,
          newCursorPosition
        );
      }
    }, 0);
  };

  const deletePermissions = canDeleteMessage();

  const renderFileMessage = (): React.ReactNode => {
    if (
      message.messageType !== "file" ||
      !message.fileUrl ||
      message.isDeleted
    ) {
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

  const getSenderInfo = (): {
    image: string | null;
    initials: string;
    firstName: string;
    lastName: string;
  } => {
    if (typeof message.sender === "string") {
      return {
        image: null,
        initials: "?",
        firstName: "",
        lastName: "",
      };
    } else {
      return {
        image: message.sender.image || null,
        initials: `${message.sender.firstName?.[0] || ""} ${
          message.sender.lastName?.[0] || ""
        }`.trim(),
        firstName: message.sender.firstName || "",
        lastName: message.sender.lastName || "",
      };
    }
  };

  const senderInfo = getSenderInfo();

  if (message.isDeleted) {
    return (
      <div
        className={`flex ${
          isCurrentUser ? "justify-end" : "justify-start"
        } mb-4`}
      >
        <div
          className={`px-4 py-2 rounded-2xl ${
            isDark ? "bg-gray-700 text-gray-400" : "bg-gray-200 text-gray-500"
          } italic`}
        >
          This message was deleted
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={`flex ${
          isCurrentUser ? "justify-end" : "justify-start"
        } mb-4 group relative`}
        ref={messageRef}
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
              className={`px-4 py-2 rounded-2xl relative ${
                isCurrentUser
                  ? isDark
                    ? "bg-blue-600 text-white"
                    : "bg-blue-500 text-white"
                  : isDark
                  ? "bg-gray-700 text-white"
                  : "bg-gray-200 text-gray-900"
              } ${isCurrentUser ? "hover:bg-blue-700" : "hover:bg-gray-600"}`}
            >
              {isEditing ? (
                <div className="flex flex-col space-y-3 min-w-[300px]">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-medium ${
                        isDark ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      Edit message
                    </span>
                    <button
                      onClick={handleCancelEdit}
                      className={`p-1 rounded-full hover:bg-opacity-20 ${
                        isDark
                          ? "text-gray-400 hover:bg-gray-600"
                          : "text-gray-500 hover:bg-gray-300"
                      }`}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Emoji Picker */}
                  {showEmojiPicker && (
                    <div
                      ref={emojiPickerRef}
                      className="absolute bottom-16 left-0 z-50"
                    >
                      <EmojiPicker
                        onEmojiClick={handleEmojiClick}
                        theme={isDark ? Theme.DARK : Theme.LIGHT}
                        height={400}
                        width={300}
                      />
                    </div>
                  )}

                  <textarea
                    ref={editInputRef}
                    value={editContent}
                    onChange={handleInputChange}
                    onPaste={handlePaste}
                    onKeyDown={handleKeyPress}
                    className={`w-full p-3 rounded-lg border focus:ring-2 focus:outline-none transition-colors font-sans ${
                      isDark
                        ? "bg-gray-600 text-white border-gray-500 focus:ring-blue-500 focus:border-blue-500"
                        : "bg-white text-gray-900 border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    } resize-none`}
                    rows={3}
                    placeholder="Edit your message..."
                    style={{
                      fontFamily: "system-ui, -apple-system, sans-serif",
                    }}
                  />
                  <div className="flex space-x-2 justify-end items-center">
                    {/* Emoji Button */}
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className={`p-2 rounded-full hover:bg-opacity-20 emoji-button ${
                        isDark
                          ? "text-gray-300 hover:bg-gray-600"
                          : "text-gray-500 hover:bg-gray-300"
                      } ${
                        showEmojiPicker
                          ? isDark
                            ? "bg-gray-600"
                            : "bg-gray-300"
                          : ""
                      }`}
                      aria-label="Add emoji"
                      title="Add emoji"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
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

                    <button
                      onClick={handleCancelEdit}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isDark
                          ? "bg-gray-600 text-gray-200 hover:bg-gray-500"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={
                        !editContent?.trim() || editMessageMutation.isPending
                      }
                      className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                    >
                      {editMessageMutation.isPending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        "Save"
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {message.messageType === "file"
                    ? renderFileMessage()
                    : message.content}

                  {/* Edit indicator */}
                  {message.isEdited && (
                    <span className="text-xs opacity-70 ml-2">(edited)</span>
                  )}
                </>
              )}
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

        {/* Message Actions Menu */}
        {isCurrentUser && !isEditing && (
          <div
            className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-all duration-200"
            ref={menuRef}
          >
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`p-2 rounded-full transition-all duration-200 ${
                isDark
                  ? "bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white shadow-lg"
                  : "bg-white hover:bg-gray-100 text-gray-500 hover:text-gray-700 shadow-md border border-gray-200"
              }`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>

            {showMenu && (
              <div
                className={`absolute right-0 mt-2 w-56 rounded-xl shadow-xl border z-50 backdrop-blur-sm ${
                  isDark
                    ? "bg-gray-800 border-gray-700 bg-opacity-95"
                    : "bg-white border-gray-200 bg-opacity-95"
                }`}
              >
                <div className="p-2">
                  {canEditMessage() && (
                    <button
                      onClick={handleEdit}
                      className={`flex items-center w-full px-3 py-2.5 text-sm rounded-lg transition-colors ${
                        isDark
                          ? "text-gray-200 hover:bg-gray-700"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <svg
                        className="w-4 h-4 mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Edit Message
                    </button>
                  )}

                  {deletePermissions.deleteForMe && (
                    <button
                      onClick={() => handleDeleteClick(false)}
                      className={`flex items-center w-full px-3 py-2.5 text-sm rounded-lg transition-colors ${
                        isDark
                          ? "text-gray-200 hover:bg-gray-700"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <svg
                        className="w-4 h-4 mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Delete for me
                    </button>
                  )}

                  {deletePermissions.deleteForEveryone && (
                    <button
                      onClick={() => handleDeleteClick(true)}
                      className={`flex items-center w-full px-3 py-2.5 text-sm rounded-lg transition-colors ${
                        isDark
                          ? "text-red-400 hover:bg-red-900 hover:bg-opacity-20"
                          : "text-red-600 hover:bg-red-50"
                      }`}
                    >
                      <svg
                        className="w-4 h-4 mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Delete for everyone
                    </button>
                  )}

                  {!canEditMessage() &&
                    !deletePermissions.deleteForMe &&
                    !deletePermissions.deleteForEveryone && (
                      <div
                        className={`px-3 py-2.5 text-sm text-center ${
                          isDark ? "text-gray-500" : "text-gray-400"
                        }`}
                      >
                        No actions available
                      </div>
                    )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        deleteForEveryone={deleteForEveryone}
        isDark={isDark}
        isLoading={deleteMessageMutation.isPending}
      />
    </>
  );
};

export default React.memo(MessageComponent);
