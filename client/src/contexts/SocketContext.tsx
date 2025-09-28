import {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
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
  messageType: "text" | "image" | "file";
  content?: string;
  fileUrl?: string;
  timestamp: Date;
  chatId: string;
  createdAt: string;
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
    let newSocket: Socket | null = null;

    if (isAuthenticated && user) {
      console.log("Connecting socket for user:", user._id);
      newSocket = io(API_BASE_URL, {
        query: { userId: user._id },
      });

      setSocket(newSocket);

      newSocket.on("connect", () => {
        console.log("Socket connected:", newSocket?.id);
      });

      newSocket.on("getOnlineUsers", (users: User[]) => {
        console.log("Online users:", users);
        setOnlineUsers(users);
      });

      // Handle incoming messages
      // In the newMessage event handler
      newSocket.on("newMessage", (serverMessage: ServerMessage) => {
        console.log("Received new message:", serverMessage);

        // Transform server message to match your ClientMessage type
        const clientMessage: ClientMessage = {
          id: serverMessage._id,
          _id: serverMessage._id,
          sender: serverMessage.sender._id,
          messageType: serverMessage.messageType,
          content: serverMessage.content,
          chatId: serverMessage.chatId,
          timestamp: new Date(serverMessage.createdAt),
          createdAt: new Date(serverMessage.createdAt),
          text: serverMessage.content, // Ensure this matches your type
        };

        const messagesQueryKey = messageKeys.list(serverMessage.chatId);

        queryClient.setQueryData<ClientMessage[]>(
          messagesQueryKey,
          (oldMessages = []) => {
            // Check if message already exists to prevent duplicates
            const messageExists = oldMessages.some(
              (msg) => msg._id === serverMessage._id
            );
            if (messageExists) {
              return oldMessages;
            }

            // Remove any temporary messages and add the real one
            const filteredMessages = oldMessages.filter(
              (msg) => !msg.id?.startsWith("temp-")
            );
            return [...filteredMessages, clientMessage];
          }
        );
      });

      newSocket.on("messageError", (error: any) => {
        console.error("Message sending error:", error);
        // You might want to show a notification to the user here
      });

      newSocket.on("disconnect", () => {
        console.log("Socket disconnected");
      });

      newSocket.on("error", (error) => {
        console.error("Socket error:", error);
      });
    } else {
      // Disconnect if not authenticated
      if (socket) {
        console.log("Disconnecting socket - user not authenticated");
        socket.close();
        setSocket(null);
      }
    }

    // Cleanup function
    return () => {
      if (newSocket) {
        console.log("Cleaning up socket");
        newSocket.off("connect");
        newSocket.off("getOnlineUsers");
        newSocket.off("newMessage");
        newSocket.off("messageError");
        newSocket.off("disconnect");
        newSocket.off("error");
        newSocket.close();
      }
    };
  }, [isAuthenticated, user, queryClient]); // Remove socket from dependencies

  const sendMessage = (chatId: string, senderId: string, content: string) => {
    if (socket && chatId && senderId && content.trim()) {
      console.log("Sending message via socket:", { chatId, senderId, content });
      socket.emit("sendMessage", { chatId, senderId, content });
    } else {
      console.error(
        "Cannot send message - missing required data or socket not connected:",
        {
          hasSocket: !!socket,
          isSocketConnected: socket?.connected,
          chatId,
          senderId,
          content,
        }
      );
    }
  };

  const value: SocketContextType = {
    socket,
    onlineUsers,
    sendMessage,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}
