import type { Socket } from "socket.io-client";
import type { OnlineUser, User } from "./types";

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
  connect: () => void;
  disconnect: () => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
}

export interface SocketMessage {
  chatId: string;
  senderId: string;
  content: string;
  messageType?: string;
}

export interface AppState {
  socket: Socket | null;
  onlineUsers: OnlineUser[]
}