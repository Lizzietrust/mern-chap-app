import { createContext, useState, useEffect, useContext, ReactNode } from "react";
import { useApp } from "./AppContext";
import type { User } from "./AppContext";
import io, { Socket } from "socket.io-client";
import { API_BASE_URL } from "../lib/api";
import { Chat } from "../types";
import { SelectedChatContext } from "./SelectedChatContext";

// Interfaces based on server models
export interface Message {
  _id: string;
  sender: User;
  recipient: User;
  message: 'text' | 'image' | 'file';
  content?: string;
  fileUrl?: string;
  timestamps: string;
}

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: User[];
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error("useSocket must be used within SocketProvider");
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const { state } = useApp();
  const { user, isAuthenticated } = state;
  const selectedChatContext = useContext(SelectedChatContext);

  if (!selectedChatContext) {
    throw new Error("SocketProvider must be used within a SelectedChatProvider");
  }

  const { selectedChat, setSelectedChat } = selectedChatContext;

  useEffect(() => {
    if (isAuthenticated && user) {
      const newSocket: Socket = io(API_BASE_URL, {
        query: { userId: user.id },
      });

      setSocket(newSocket);

      newSocket.on("connect", () => {
        console.log("Socket connected:", newSocket.id);
      });

      newSocket.on("getOnlineUsers", (users: User[]) => {
        setOnlineUsers(users);
      });

      const handleReceiveMessage = (message: any) => {
        // Logic to handle incoming messages and update selectedChat
      }

      newSocket.on("receiveMessage", handleReceiveMessage);

      return () => {
        newSocket.off("getOnlineUsers");
        newSocket.off("receiveMessage");
        newSocket.close();
        setSocket(null);
        console.log("Socket disconnected");
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [isAuthenticated, user]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
}