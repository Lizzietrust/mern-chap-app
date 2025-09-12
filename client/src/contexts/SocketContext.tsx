import { createContext, useState, useEffect, useContext, ReactNode } from "react";
import { useApp } from "./AppContext";
import type { User } from "./AppContext";
import io, { Socket } from "socket.io-client";
import { API_BASE_URL } from "../lib/api";
import type { Chat, Message as ClientMessage } from "../types";
import { useQueryClient } from "@tanstack/react-query";
import { messageKeys } from "../hooks/useChat";

// Interfaces based on server models
export interface ServerMessage {
  _id: string;
  sender: User;
  messageType: 'text' | 'image' | 'file'; // Consider renaming from 'message'
  content?: string;
  fileUrl?: string;
  timestamp: Date; // Use Date type instead of string
  chatId: string;
}

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: User[];
  sendMessage: (chatId: string, senderId: string, content: string) => void;
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
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isAuthenticated && user) {
      const newSocket: Socket = io(API_BASE_URL, {
        query: { userId: user._id },
      });

      setSocket(newSocket);

      newSocket.on("connect", () => {
        console.log("Socket connected:", newSocket.id);
      });

      newSocket.on("getOnlineUsers", (users: User[]) => {
        setOnlineUsers(users);
      });
      

      const transformMessage = (serverMessage: ServerMessage): ClientMessage => {
        return {
          id: serverMessage._id,
          text: serverMessage.content || '',
          sender: serverMessage.sender._id === user?._id ? 'user' : 'other',
          timestamp: new Date(serverMessage.timestamps),
        };
      };

      const handleNewMessage = (message: ServerMessage) => {
        const transformedMessage = transformMessage(message);
        const messagesQueryKey = messageKeys.list(message.chatId);
        
        queryClient.setQueryData<ClientMessage[]>(messagesQueryKey, (oldMessages) => {
          if (!oldMessages) return [transformedMessage];
          // Avoid duplicates
          if (oldMessages.some(m => m.id === transformedMessage.id)) return oldMessages;
          return [...oldMessages, transformedMessage];
        });
      }

      newSocket.on("newMessage", handleNewMessage);

      return () => {
        newSocket.off("getOnlineUsers");
        newSocket.off("newMessage");
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
  }, [isAuthenticated, user, queryClient]);

  const sendMessage = (chatId: string, senderId: string, content: string) => {
    if (socket) {
      socket.emit("sendMessage", { chatId, senderId, content });
    }
  };

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, sendMessage }}>
      {children}
    </SocketContext.Provider>
  );
}