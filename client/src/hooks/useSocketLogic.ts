import { useState, useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import io, { type Socket } from "socket.io-client";
import { useApp } from "../contexts/appcontext/index";
import { API_BASE_URL } from "../lib/api";
import { messageKeys } from "./useChat";
import { SOCKET_EVENTS, SOCKET_CONFIG } from "../constants/socket";
import type { SocketContextType } from "../types/socket";
import type { User, Message as ClientMessage } from "../types/types";

interface ServerMessage {
  _id: string;
  sender: string | { _id: string };
  messageType: string;
  content: string;
  chatId: string;
  createdAt: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
}

interface UserOnlineData {
  userId: string;
  user: User;
}

interface UserOfflineData {
  userId: string;
  lastSeen: Date;
}

// interface ChatUpdatedData {
//   chatId: string;
// }

export function useSocketLogic(): SocketContextType {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { state } = useApp();
  const { user, isAuthenticated } = state;
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  const transformServerMessage = useCallback(
    (serverMessage: ServerMessage): ClientMessage => {
      const baseMessage = {
        _id: serverMessage._id,
        id: serverMessage._id,
        sender: serverMessage.sender,
        messageType: serverMessage.messageType,
        content: serverMessage.content || "",
        chatId: serverMessage.chatId,
        chat: serverMessage.chatId,
        timestamp: new Date(serverMessage.createdAt),
        createdAt: new Date(serverMessage.createdAt),
        fileUrl: serverMessage.fileUrl,
        fileName: serverMessage.fileName,
        fileSize: serverMessage.fileSize,
      };

      if (serverMessage.messageType === "text") {
        return {
          ...baseMessage,
          text: serverMessage.content || "",
        } as ClientMessage;
      } else {
        return baseMessage as ClientMessage;
      }
    },
    []
  );

  const filterAndAddMessage = useCallback(
    (
      oldMessages: ClientMessage[],
      newMessage: ClientMessage,
      serverMessage: ServerMessage
    ): ClientMessage[] => {
      const filteredMessages = oldMessages.filter((msg) => {
        if (!msg._id?.startsWith("temp-") && !msg.isOptimistic) {
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

      return [...filteredMessages, newMessage];
    },
    []
  );

  const handleNewMessage = useCallback(
    (serverMessage: ServerMessage) => {
      const clientMessage = transformServerMessage(serverMessage);
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
          return filterAndAddMessage(oldMessages, clientMessage, serverMessage);
        }
      );

      queryClient.invalidateQueries({ queryKey: ["chats"] });
      queryClient.invalidateQueries({ queryKey: ["channels"] });
    },
    [queryClient, transformServerMessage, filterAndAddMessage]
  );

  const eventHandlers = useRef({
    onConnect: () => {
      console.log("✅ Socket connected:", socketRef.current?.id);
      setIsConnected(true);
    },

    onConnectError: (error: Error) => {
      console.error("🔌 Socket connection error:", error);
      setIsConnected(false);
    },

    onOnlineUsers: (users: User[]) => {
      console.log("📋 Received online users:", users.length);
      setOnlineUsers(users);
    },

    onUserOnline: (data: UserOnlineData) => {
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
    },

    onUserOffline: (data: UserOfflineData) => {
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
    },

    onNewMessage: handleNewMessage,

    onChatUpdated: () => {
      console.log("🔄 Chat updated, refreshing chats list");
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      queryClient.invalidateQueries({ queryKey: ["userChats"] });
    },

    onDisconnect: (reason: string) => {
      console.log("❌ Socket disconnected. Reason:", reason);
      setIsConnected(false);
    },

    onError: (error: Error) => {
      console.error("Socket error:", error);
      setIsConnected(false);
    },
  });

  const initializeSocket = useCallback(() => {
    if (!user?._id) return;

    console.log("🔌 Connecting socket for user:", user._id);

    const newSocket = io(API_BASE_URL, SOCKET_CONFIG);
    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on(SOCKET_EVENTS.CONNECT, eventHandlers.current.onConnect);
    newSocket.on(
      SOCKET_EVENTS.CONNECT_ERROR,
      eventHandlers.current.onConnectError
    );
    newSocket.on(
      SOCKET_EVENTS.ONLINE_USERS,
      eventHandlers.current.onOnlineUsers
    );
    newSocket.on(SOCKET_EVENTS.USER_ONLINE, eventHandlers.current.onUserOnline);
    newSocket.on(
      SOCKET_EVENTS.USER_OFFLINE,
      eventHandlers.current.onUserOffline
    );
    newSocket.on(SOCKET_EVENTS.NEW_MESSAGE, eventHandlers.current.onNewMessage);
    newSocket.on(
      SOCKET_EVENTS.CHAT_UPDATED,
      eventHandlers.current.onChatUpdated
    );
    newSocket.on(SOCKET_EVENTS.DISCONNECT, eventHandlers.current.onDisconnect);
    newSocket.on(SOCKET_EVENTS.ERROR, eventHandlers.current.onError);
  }, [user?._id]);

  const cleanupSocket = useCallback(() => {
    if (socketRef.current) {
      console.log("🧹 Cleaning up socket");
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
      setOnlineUsers([]);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user?._id) {
      cleanupSocket();
      return;
    }

    initializeSocket();

    return () => {
      cleanupSocket();
    };
  }, [isAuthenticated, user?._id, initializeSocket, cleanupSocket]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log("🔌 Disconnecting socket on page unload");
      cleanupSocket();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [cleanupSocket]);

  const updateUserStatus = useCallback((isOnline: boolean) => {
    if (socketRef.current?.connected) {
      console.log(
        `🔄 Updating user status to: ${isOnline ? "online" : "offline"}`
      );
      socketRef.current.emit(SOCKET_EVENTS.UPDATE_USER_STATUS, { isOnline });
    } else {
      console.warn("⚠️ Cannot update user status - socket not connected");
    }
  }, []);

  const sendMessage = useCallback(
    (
      chatId: string,
      senderId: string,
      content: string,
      messageType: string = "text"
    ) => {
      if (
        socketRef.current?.connected &&
        chatId &&
        senderId &&
        content.trim()
      ) {
        console.log("📤 Sending message via socket:", {
          chatId,
          senderId,
          content,
          messageType,
        });
        socketRef.current.emit(SOCKET_EVENTS.SEND_MESSAGE, {
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
    },
    []
  );

  const joinChat = useCallback((chatId: string) => {
    if (socketRef.current?.connected && chatId) {
      console.log(`👥 Joining chat room: ${chatId}`);
      socketRef.current.emit(SOCKET_EVENTS.JOIN_CHAT, chatId);
    } else {
      console.error(
        "Cannot join chat - socket not connected or missing chatId"
      );
    }
  }, []);

  const leaveChat = useCallback((chatId: string) => {
    if (socketRef.current?.connected && chatId) {
      console.log(`👋 Leaving chat room: ${chatId}`);
      socketRef.current.emit(SOCKET_EVENTS.LEAVE_CHAT, chatId);
    } else {
      console.error(
        "Cannot leave chat - socket not connected or missing chatId"
      );
    }
  }, []);

  return {
    socket,
    onlineUsers,
    sendMessage,
    joinChat,
    leaveChat,
    isConnected,
    updateUserStatus,
  };
}
