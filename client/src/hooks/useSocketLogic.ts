import { useState, useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import io, { type Socket } from "socket.io-client";
import { useApp } from "../contexts/appcontext/index";
import { API_BASE_URL } from "../lib/api";
import { MESSAGE_KEYS as messageKeys } from "../hooks/chats";
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
  status?: "sent" | "delivered" | "read";
  readBy?: string[] | User[];
  readReceipts?: Array<{
    user: string | User;
    readAt: Date;
  }>;
}

interface UserOnlineData {
  userId: string;
  user: User;
}

interface UserOfflineData {
  userId: string;
  lastSeen: Date;
}

interface MessageStatusUpdateData {
  messageId: string;
  status: "sent" | "delivered" | "read";
  readBy?: string[] | User[];
  chatId: string;
}

export function useSocketLogic(): SocketContextType {
  const [isConnected, setIsConnected] = useState(false);
  const { state, dispatch } = useApp();
  const { user, isAuthenticated } = state;
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  const chatUpdateTimerRef = useRef<number | null>(null);
  const lastChatUpdateRef = useRef<number>(0);
  const chatUpdateCountRef = useRef<number>(0);

  const setSocketInAppState = useCallback(
    (newSocket: Socket | null) => {
      dispatch({ type: "SET_SOCKET", payload: newSocket });
    },
    [dispatch]
  );

  const setOnlineUsersInAppState = useCallback(
    (users: User[]) => {
      dispatch({ type: "SET_ONLINE_USERS", payload: users });
    },
    [dispatch]
  );

  const updateOnlineUsers = useCallback(
    (updater: (prev: User[]) => User[]) => {
      const currentOnlineUsers = Array.isArray(state.onlineUsers)
        ? state.onlineUsers
        : [];
      const updatedUsers = updater(currentOnlineUsers);
      setOnlineUsersInAppState(updatedUsers);
    },
    [state.onlineUsers, setOnlineUsersInAppState]
  );

  const transformServerMessage = useCallback(
    (serverMessage: ServerMessage): ClientMessage => {
      const baseMessage = {
        _id: serverMessage._id,
        id: serverMessage._id,
        sender: serverMessage.sender,
        messageType: serverMessage.messageType as
          | "text"
          | "image"
          | "file"
          | "audio"
          | "video"
          | "system",
        content: serverMessage.content || "",
        chatId: serverMessage.chatId,
        chat: serverMessage.chatId,
        timestamp: new Date(serverMessage.createdAt).toISOString(),
        createdAt: new Date(serverMessage.createdAt).toISOString(),
        fileUrl: serverMessage.fileUrl,
        fileName: serverMessage.fileName,
        fileSize: serverMessage.fileSize,
        status:
          (serverMessage.status as "sent" | "delivered" | "read") || "sent",
        readBy: serverMessage.readBy || [],
        readReceipts: serverMessage.readReceipts || [],
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

  const debouncedHandleChatUpdated = useCallback(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastChatUpdateRef.current;

    chatUpdateCountRef.current += 1;

    if (timeSinceLastUpdate < 3000) {
      return;
    }

    if (chatUpdateTimerRef.current !== null) {
      window.clearTimeout(chatUpdateTimerRef.current);
    }

    chatUpdateTimerRef.current = window.setTimeout(() => {
      lastChatUpdateRef.current = Date.now();
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      queryClient.invalidateQueries({ queryKey: ["userChats"] });
      chatUpdateTimerRef.current = null;
    }, 1000);
  }, [queryClient]);

  const handleMessageStatusUpdate = useCallback(
    (data: MessageStatusUpdateData) => {
      const { messageId, status, readBy, chatId } = data;

      const messagesQueryKey = messageKeys.list(chatId);

      queryClient.setQueryData<ClientMessage[]>(
        messagesQueryKey,
        (oldMessages = []) => {
          return oldMessages.map((msg) =>
            msg._id === messageId
              ? {
                  ...msg,
                  status,
                  readBy: readBy || msg.readBy,
                }
              : msg
          );
        }
      );

      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
    [queryClient]
  );

  const markMessageAsDelivered = useCallback(
    async (messageId: string, userId: string) => {
      try {
        if (socketRef.current?.connected) {
          socketRef.current.emit("markAsDelivered", {
            messageId,
            userId,
          });
        }
      } catch (error) {
        console.error("Error marking message as delivered:", error);
      }
    },
    []
  );

  const handleOnlineUsers = useCallback(
    (users: User[]) => {
      console.log("📋 Received online users:", users.length);
      setOnlineUsersInAppState(users);
    },
    [setOnlineUsersInAppState]
  );

  const handleUserOnline = useCallback(
    (data: UserOnlineData) => {
      console.log("🟢 User came online:", data.userId);
      updateOnlineUsers((prev) => {
        const exists = prev.some((u) => u._id === data.userId);
        if (exists) {
          return prev.map((u) =>
            u._id === data.userId ? { ...u, isOnline: true } : u
          );
        }
        return [...prev, { ...data.user, isOnline: true }];
      });
    },
    [updateOnlineUsers]
  );

  const handleUserOffline = useCallback(
    (data: UserOfflineData) => {
      console.log("🔴 User went offline:", data.userId);
      updateOnlineUsers((prev) =>
        prev.map((u) =>
          u._id === data.userId
            ? { ...u, isOnline: false, lastSeen: data.lastSeen }
            : u
        )
      );
    },
    [updateOnlineUsers]
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
            return oldMessages;
          }

          return filterAndAddMessage(oldMessages, clientMessage, serverMessage);
        }
      );

      queryClient.invalidateQueries({ queryKey: ["channels"] });

      const currentUserId = state.user?._id;
      if (currentUserId && serverMessage.sender !== currentUserId) {
        markMessageAsDelivered(serverMessage._id, currentUserId);
      }
    },
    [
      transformServerMessage,
      filterAndAddMessage,
      queryClient,
      markMessageAsDelivered,
      state.user?._id,
    ]
  );

  const handleChatUpdated = useCallback(() => {
    debouncedHandleChatUpdated();
  }, [debouncedHandleChatUpdated]);

  const handleMessageStatusUpdateEvent = useCallback(
    (data: MessageStatusUpdateData) => {
      handleMessageStatusUpdate(data);
    },
    [handleMessageStatusUpdate]
  );

  const initializeSocket = useCallback(() => {
    if (!user?._id || socketRef.current) return;

    console.log("🔌 Connecting socket for user:", user._id);

    const newSocket = io(API_BASE_URL, SOCKET_CONFIG);
    socketRef.current = newSocket;
    setSocketInAppState(newSocket);

    newSocket.on(SOCKET_EVENTS.CONNECT, () => {
      console.log("✅ Socket connected:", newSocket.id);
      setIsConnected(true);

      newSocket.emit("getOnlineUsers");
    });

    newSocket.on(SOCKET_EVENTS.CONNECT_ERROR, (error: Error) => {
      console.error("🔌 Socket connection error:", error);
      setIsConnected(false);
    });

    newSocket.on(SOCKET_EVENTS.ONLINE_USERS, handleOnlineUsers);
    newSocket.on(SOCKET_EVENTS.USER_ONLINE, handleUserOnline);
    newSocket.on(SOCKET_EVENTS.USER_OFFLINE, handleUserOffline);
    newSocket.on(SOCKET_EVENTS.NEW_MESSAGE, handleNewMessage);
    newSocket.on(SOCKET_EVENTS.CHAT_UPDATED, handleChatUpdated);
    newSocket.on(
      SOCKET_EVENTS.MESSAGE_STATUS_UPDATE,
      handleMessageStatusUpdateEvent
    );

    newSocket.on(SOCKET_EVENTS.DISCONNECT, (reason: string) => {
      console.log("❌ Socket disconnected. Reason:", reason);
      setIsConnected(false);
    });

    newSocket.on(SOCKET_EVENTS.ERROR, (error: Error) => {
      console.error("Socket error:", error);
      setIsConnected(false);
    });
  }, [
    user?._id,
    setSocketInAppState,
    handleOnlineUsers,
    handleUserOnline,
    handleUserOffline,
    handleNewMessage,
    handleChatUpdated,
    handleMessageStatusUpdateEvent,
  ]);

  const cleanupSocket = useCallback(() => {
    if (chatUpdateTimerRef.current !== null) {
      window.clearTimeout(chatUpdateTimerRef.current);
      chatUpdateTimerRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocketInAppState(null);
      setOnlineUsersInAppState([]);
      setIsConnected(false);
    }

    lastChatUpdateRef.current = 0;
    chatUpdateCountRef.current = 0;
  }, [setSocketInAppState, setOnlineUsersInAppState]);

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
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const connect = useCallback(() => {
    if (!socketRef.current && user?._id) {
      initializeSocket();
    }
  }, [initializeSocket, user?._id]);

  const disconnect = useCallback(() => {
    cleanupSocket();
  }, [cleanupSocket]);

  const joinRoom = useCallback((roomId: string) => {
    if (socketRef.current?.connected && roomId) {
      socketRef.current.emit(SOCKET_EVENTS.JOIN_CHAT, roomId);
      console.log("Joined room:", roomId);
    }
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    if (socketRef.current?.connected && roomId) {
      socketRef.current.emit(SOCKET_EVENTS.LEAVE_CHAT, roomId);
      console.log("Left room:", roomId);
    }
  }, []);

  const joinChat = useCallback((chatId: string) => {
    if (socketRef.current?.connected && chatId) {
      socketRef.current.emit(SOCKET_EVENTS.JOIN_CHAT, chatId);
    }
  }, []);

  const leaveChat = useCallback((chatId: string) => {
    if (socketRef.current?.connected && chatId) {
      socketRef.current.emit(SOCKET_EVENTS.LEAVE_CHAT, chatId);
    }
  }, []);

  const sendMessage = useCallback(
    (messageData: {
      chatId: string;
      content: string;
      messageType: string;
      sender: User;
    }) => {
      if (
        socketRef.current?.connected &&
        messageData.chatId &&
        messageData.content.trim()
      ) {
        socketRef.current.emit(SOCKET_EVENTS.SEND_MESSAGE, {
          chatId: messageData.chatId,
          senderId: messageData.sender._id,
          content: messageData.content,
          messageType: messageData.messageType,
        });
      }
    },
    []
  );

  const updateUserStatus = useCallback((isOnline: boolean) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(SOCKET_EVENTS.UPDATE_USER_STATUS, { isOnline });
    }
  }, []);

  return {
    socket: state.socket,
    onlineUsers: Array.isArray(state.onlineUsers) ? state.onlineUsers : [],
    sendMessage,
    joinChat,
    leaveChat,
    isConnected,
    updateUserStatus,
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
  };
}
