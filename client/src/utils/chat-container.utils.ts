import type { Message } from "../types/types";

export const getSenderName = (message: Message): string => {
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

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const extractFileName = (content: string): string => {
  const match = content.match(/📎 (.+?) \(/);
  return match ? match[1] : content;
};

export const extractFileSize = (content: string): string => {
  const match = content.match(/\(([^)]+)\)/);
  return match ? match[1] : "";
};

export const downloadFile = async (
  fileUrl: string,
  fileName: string
): Promise<void> => {
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
    window.open(fileUrl, "_blank");
  }
};

export const shouldShowSenderName = (
  message: Message,
  index: number,
  messages: Message[],
  isChannel: boolean,
  currentUserId?: string
): boolean => {
  if (!isChannel) return false;

  const isCurrentUser =
    (typeof message.sender === "object" &&
      message.sender._id === currentUserId) ||
    message.sender === currentUserId;

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
