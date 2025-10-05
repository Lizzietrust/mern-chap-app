import { useState, useEffect, type ReactNode } from "react";
import { useApp } from "./AppContext";
import type { User } from "./AppContext";
import io, { Socket } from "socket.io-client";
import { API_BASE_URL } from "../lib/api";
import type { Message as ClientMessage } from "../types";
import { useQueryClient } from "@tanstack/react-query";
import { messageKeys } from "../hooks/useChat";
import { SocketContext } from "./socket-context";

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

export interface SocketContextType {
  socket: Socket | null;
  onlineUsers: User[];
  sendMessage: (
    chatId: string,
    senderId: string,
    content: string,
    messageType?: string
  ) => void;
}

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

    if (isAuthenticated && user?._id) {
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

      newSocket.on("newMessage", (serverMessage: ServerMessage) => {
        console.log("Received new message:", serverMessage);

        const clientMessage: ClientMessage = {
          id: serverMessage._id,
          _id: serverMessage._id,
          sender: serverMessage.sender,
          messageType: serverMessage.messageType,
          content: serverMessage.content || "",
          chatId: serverMessage.chatId,
          timestamp: new Date(serverMessage.createdAt),
          createdAt: new Date(serverMessage.createdAt),
          text: serverMessage.content || "",
          fileUrl: serverMessage.fileUrl,
        };

        const messagesQueryKey = messageKeys.list(serverMessage.chatId);

        queryClient.setQueryData<ClientMessage[]>(
          messagesQueryKey,
          (oldMessages = []) => {
            const messageExists = oldMessages.some(
              (msg) => msg._id === serverMessage._id
            );
            if (messageExists) {
              return oldMessages;
            }

            const filteredMessages = oldMessages.filter(
              (msg) => !msg.id?.startsWith("temp-")
            );
            return [...filteredMessages, clientMessage];
          }
        );

        queryClient.invalidateQueries({ queryKey: ["chats"] });
      });

      newSocket.on("messageError", (error: unknown) => {
        console.error("Message sending error occurred");

        if (error instanceof Error) {
          console.error("Error message:", error.message);
        } else if (typeof error === "string") {
          console.error("Error string:", error);
        } else {
          console.error("Unknown error type:", error);
        }
      });

      newSocket.on("disconnect", () => {
        console.log("Socket disconnected");
      });

      newSocket.on("error", (error) => {
        console.error("Socket error:", error);
      });
    } else {
      if (socket) {
        console.log("Disconnecting socket - user not authenticated");
        socket.close();
        setSocket(null);
      }
    }

    return () => {
      if (newSocket) {
        console.log("Cleaning up socket");
        newSocket.disconnect();
      }
    };
  }, [isAuthenticated, user?._id, queryClient]);

  const sendMessage = (
    chatId: string,
    senderId: string,
    content: string,
    messageType: string = "text"
  ) => {
    if (socket && chatId && senderId && content.trim()) {
      console.log("Sending message via socket:", {
        chatId,
        senderId,
        content,
        messageType,
      });

      socket.emit("sendMessage", {
        chatId,
        senderId,
        content,
        messageType,
      });
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
