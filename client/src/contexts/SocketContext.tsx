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
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  isConnected: boolean;
}

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { state } = useApp();
  const { user, isAuthenticated } = state;
  const queryClient = useQueryClient();

  useEffect(() => {
    let newSocket: Socket | null = null;

    if (isAuthenticated && user?._id) {
      console.log("Connecting socket for user:", user._id);
      newSocket = io(API_BASE_URL, {
        auth: {
          token: localStorage.getItem("token"),
        },
        query: { userId: user._id },
      });

      setSocket(newSocket);

      newSocket.on("connect", () => {
        console.log("Socket connected:", newSocket?.id);
        setIsConnected(true);
      });

      newSocket.on("getOnlineUsers", (users: User[]) => {
        console.log("Online users:", users);
        setOnlineUsers(users);
      });

      newSocket.on("newMessage", (serverMessage: ServerMessage) => {
        console.log("📨 Received new message via socket:", serverMessage);

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
          fileName: serverMessage.fileName,
          fileSize: serverMessage.fileSize,
        };

        const messagesQueryKey = messageKeys.list(serverMessage.chatId);

        queryClient.setQueryData<ClientMessage[]>(
          messagesQueryKey,
          (oldMessages = []) => {
            const messageExists = oldMessages.some(
              (msg) => msg._id === serverMessage._id
            );

            if (messageExists) {
              console.log("Message already exists, skipping");
              return oldMessages;
            }

            console.log("Adding new message from socket");

            const filteredMessages = oldMessages.filter((msg) => {
              if (!msg._id.startsWith("temp-") && !msg.isOptimistic) {
                return true;
              }

              const msgSenderId =
                typeof msg.sender === "object" ? msg.sender._id : msg.sender;
              const newSenderId =
                typeof serverMessage.sender === "object"
                  ? serverMessage.sender._id
                  : serverMessage.sender;

              return msgSenderId !== newSenderId;
            });

            return [...filteredMessages, clientMessage];
          }
        );

        queryClient.invalidateQueries({ queryKey: ["chats"] });
        queryClient.invalidateQueries({ queryKey: ["channels"] });
      });

      newSocket.on("typing", (data) => {
        console.log("Typing event:", data);
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
        setIsConnected(false);
      });

      newSocket.on("error", (error) => {
        console.error("Socket error:", error);
        setIsConnected(false);
      });
    } else {
      if (socket) {
        console.log("Disconnecting socket - user not authenticated");
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
    }

    return () => {
      if (newSocket) {
        console.log("Cleaning up socket");
        newSocket.disconnect();
        setIsConnected(false);
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

  const joinChat = (chatId: string) => {
    if (socket && chatId) {
      console.log(`Joining chat room: ${chatId}`);
      socket.emit("joinChat", chatId);
    } else {
      console.error(
        "Cannot join chat - socket not connected or missing chatId"
      );
    }
  };

  const leaveChat = (chatId: string) => {
    if (socket && chatId) {
      console.log(`Leaving chat room: ${chatId}`);
      socket.emit("leaveChat", chatId);
    } else {
      console.error(
        "Cannot leave chat - socket not connected or missing chatId"
      );
    }
  };

  const value: SocketContextType = {
    socket,
    onlineUsers,
    sendMessage,
    joinChat,
    leaveChat,
    isConnected,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}
