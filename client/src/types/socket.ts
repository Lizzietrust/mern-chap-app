import type { Socket } from "socket.io-client";
import type { User } from "./types";

export interface SocketContextType {
  socket: Socket | null;
  onlineUsers: User[];
  sendMessage: (messageData: {
    chatId: string;
    content: string;
    messageType: string;
    sender: User;
  }) => void;
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  isConnected: boolean;
  updateUserStatus: (isOnline: boolean) => void;
}

export interface SocketMessage {
  chatId: string;
  senderId: string;
  content: string;
  messageType?: string;
}
