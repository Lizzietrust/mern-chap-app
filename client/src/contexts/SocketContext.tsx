import { useState, useEffect, type ReactNode } from "react";
import { useApp } from "./AppContext";
import type { User } from "./AppContext";
import io, { Socket } from "socket.io-client";
import { API_BASE_URL } from "../lib/api";
import type { Message as ClientMessage } from "../types";
import { useQueryClient } from "@tanstack/react-query";
import { messageKeys } from "../hooks/useChat";
import { SocketContext } from "./socket-context";

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
  updateUserStatus: (isOnline: boolean) => void;
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

  // Main socket connection effect
  useEffect(() => {
    let newSocket: Socket | null = null;

    if (isAuthenticated && user?._id) {
      console.log("🔌 Connecting socket for user:", user._id);

      newSocket = io(API_BASE_URL, {
        withCredentials: true, // Important for sending cookies
        transports: ["websocket", "polling"],
      });

      setSocket(newSocket);

      // Socket event handlers
      newSocket.on("connect", () => {
        console.log("✅ Socket connected:", newSocket?.id);
        setIsConnected(true);
      });

      newSocket.on("connect_error", (error) => {
        console.error("🔌 Socket connection error:", error);
        console.error("Error details:", {
          message: error.message,
          description: error.description,
          context: error.context,
        });
        setIsConnected(false);
      });

      newSocket.on("onlineUsers", (users: User[]) => {
        console.log("📋 Received online users:", users.length);
        setOnlineUsers(users);
      });

      newSocket.on("userOnline", (data: { userId: string; user: User }) => {
        console.log("🟢 User came online:", data.userId);
        setOnlineUsers((prev) => {
          const exists = prev.some((u) => u._id === data.userId);
          if (exists) {
            return prev.map((u) =>
              u._id === data.userId ? { ...u, isOnline: true } : u
            );
          }
          return [...prev, data.user];
        });
        queryClient.invalidateQueries({ queryKey: ["chats"] });
      });

      newSocket.on(
        "userOffline",
        (data: { userId: string; lastSeen: Date }) => {
          console.log("🔴 User went offline:", data.userId);
          setOnlineUsers((prev) =>
            prev.map((u) =>
              u._id === data.userId
                ? { ...u, isOnline: false, lastSeen: data.lastSeen }
                : u
            )
          );

          queryClient.invalidateQueries({ queryKey: ["chats"] });
          queryClient.invalidateQueries({ queryKey: ["userChats"] });
        }
      );

      // Handle new messages from socket
      newSocket.on("newMessage", (serverMessage: any) => {
        console.log("📨 Received new message via socket");

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

      newSocket.on("chatUpdated", (data: { chatId: string }) => {
        console.log("🔄 Chat updated, refreshing chats list");
        queryClient.invalidateQueries({ queryKey: ["chats"] });
        queryClient.invalidateQueries({ queryKey: ["userChats"] });
      });

      newSocket.on("disconnect", (reason) => {
        console.log("❌ Socket disconnected. Reason:", reason);
        setIsConnected(false);
      });

      newSocket.on("error", (error) => {
        console.error("Socket error:", error);
        setIsConnected(false);
      });
    } else {
      // Clean up if user is not authenticated
      if (socket) {
        console.log("Disconnecting socket - user not authenticated");
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
        setOnlineUsers([]);
      }
    }

    return () => {
      if (newSocket) {
        console.log("🧹 Cleaning up socket");
        newSocket.disconnect();
        setIsConnected(false);
      }
    };
  }, [isAuthenticated, user?._id, queryClient]);

  // Handle browser/tab close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (socket) {
        console.log("🔌 Disconnecting socket on page unload");
        socket.disconnect();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [socket]);

  // Socket methods
  const updateUserStatus = (isOnline: boolean) => {
    if (socket && socket.connected) {
      console.log(
        `🔄 Manually updating user status to: ${
          isOnline ? "online" : "offline"
        }`
      );
      socket.emit("updateUserStatus", { isOnline });
    } else {
      console.warn("⚠️ Cannot update user status - socket not connected");
    }
  };

  const sendMessage = (
    chatId: string,
    senderId: string,
    content: string,
    messageType: string = "text"
  ) => {
    if (socket && socket.connected && chatId && senderId && content.trim()) {
      console.log("📤 Sending message via socket:", {
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
        "Cannot send message - socket not connected or missing data"
      );
    }
  };

  const joinChat = (chatId: string) => {
    if (socket && socket.connected && chatId) {
      console.log(`👥 Joining chat room: ${chatId}`);
      socket.emit("joinChat", chatId);
    } else {
      console.error(
        "Cannot join chat - socket not connected or missing chatId"
      );
    }
  };

  const leaveChat = (chatId: string) => {
    if (socket && socket.connected && chatId) {
      console.log(`👋 Leaving chat room: ${chatId}`);
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
    updateUserStatus,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}
