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
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { state } = useApp();
  const { user, isAuthenticated } = state;
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  const chatUpdateTimerRef = useRef<number | null>(null);
  const lastChatUpdateRef = useRef<number>(0);
  const chatUpdateCountRef = useRef<number>(0);

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
      console.log(
        `⏳ Chat update #${
          chatUpdateCountRef.current
        } ignored (debounced, last update was ${Math.round(
          timeSinceLastUpdate / 1000
        )}s ago)`
      );
      return;
    }

    if (chatUpdateTimerRef.current !== null) {
      window.clearTimeout(chatUpdateTimerRef.current);
    }

    chatUpdateTimerRef.current = window.setTimeout(() => {
      console.log(
        `🔄 Chat update #${chatUpdateCountRef.current} applied (after debounce)`
      );
      lastChatUpdateRef.current = Date.now();
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      queryClient.invalidateQueries({ queryKey: ["userChats"] });
      chatUpdateTimerRef.current = null;
    }, 1000);
  }, [queryClient]);

  const handleMessageStatusUpdate = useCallback(
    (data: MessageStatusUpdateData) => {
      console.log(
        `📨 Message status update: ${data.messageId} -> ${data.status}`
      );

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

  const eventHandlersRef = useRef({
    handleNewMessage: (serverMessage: ServerMessage) => {
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

      queryClient.invalidateQueries({ queryKey: ["channels"] });
    },

    handleChatUpdated: () => {
      debouncedHandleChatUpdated();
    },

    handleOnlineUsers: (users: User[]) => {
      console.log("📋 Received online users:", users.length);
      setOnlineUsers(users);
    },

    handleUserOnline: (data: UserOnlineData) => {
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
    },

    handleUserOffline: (data: UserOfflineData) => {
      console.log("🔴 User went offline:", data.userId);
      setOnlineUsers((prev) =>
        prev.map((u) =>
          u._id === data.userId
            ? { ...u, isOnline: false, lastSeen: data.lastSeen }
            : u
        )
      );
    },

    handleMessageStatusUpdate: (data: MessageStatusUpdateData) => {
      handleMessageStatusUpdate(data);
    },
  });

  useEffect(() => {
    eventHandlersRef.current.handleNewMessage = (
      serverMessage: ServerMessage
    ) => {
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
    };

    eventHandlersRef.current.handleChatUpdated = () => {
      debouncedHandleChatUpdated();
    };

    eventHandlersRef.current.handleMessageStatusUpdate = (
      data: MessageStatusUpdateData
    ) => {
      handleMessageStatusUpdate(data);
    };
  }, [
    transformServerMessage,
    filterAndAddMessage,
    queryClient,
    debouncedHandleChatUpdated,
    handleMessageStatusUpdate,
  ]);

  const initializeSocket = useCallback(() => {
    if (!user?._id || socketRef.current) return;

    console.log("🔌 Connecting socket for user:", user._id);

    const newSocket = io(API_BASE_URL, SOCKET_CONFIG);
    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on(SOCKET_EVENTS.CONNECT, () => {
      console.log("✅ Socket connected:", newSocket.id);
      setIsConnected(true);

      newSocket.emit("userOnline", user._id);
      console.log(`🟢 Emitted userOnline for user: ${user._id}`);
    });

    newSocket.on(SOCKET_EVENTS.CONNECT_ERROR, (error: Error) => {
      console.error("🔌 Socket connection error:", error);
      setIsConnected(false);
    });

    newSocket.on(
      SOCKET_EVENTS.ONLINE_USERS,
      eventHandlersRef.current.handleOnlineUsers
    );
    newSocket.on(
      SOCKET_EVENTS.USER_ONLINE,
      eventHandlersRef.current.handleUserOnline
    );
    newSocket.on(
      SOCKET_EVENTS.USER_OFFLINE,
      eventHandlersRef.current.handleUserOffline
    );
    newSocket.on(SOCKET_EVENTS.NEW_MESSAGE, (msg: ServerMessage) =>
      eventHandlersRef.current.handleNewMessage(msg)
    );
    newSocket.on(SOCKET_EVENTS.CHAT_UPDATED, () =>
      eventHandlersRef.current.handleChatUpdated()
    );

    newSocket.on(
      SOCKET_EVENTS.MESSAGE_STATUS_UPDATE,
      (data: MessageStatusUpdateData) =>
        eventHandlersRef.current.handleMessageStatusUpdate(data)
    );

    newSocket.on(SOCKET_EVENTS.DISCONNECT, (reason: string) => {
      console.log("❌ Socket disconnected. Reason:", reason);
      setIsConnected(false);
    });

    newSocket.on(SOCKET_EVENTS.ERROR, (error: Error) => {
      console.error("Socket error:", error);
      setIsConnected(false);
    });
  }, [user?._id]);

  const cleanupSocket = useCallback(() => {
    if (chatUpdateTimerRef.current !== null) {
      window.clearTimeout(chatUpdateTimerRef.current);
      chatUpdateTimerRef.current = null;
    }

    if (socketRef.current) {
      console.log("🧹 Cleaning up socket");
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
      setOnlineUsers([]);
    }

    lastChatUpdateRef.current = 0;
    chatUpdateCountRef.current = 0;
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
      cleanupSocket();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [cleanupSocket]);

  const joinChat = useCallback((chatId: string) => {
    if (socketRef.current?.connected && chatId) {
      console.log(`👥 Joining chat room: ${chatId}`);
      socketRef.current.emit(SOCKET_EVENTS.JOIN_CHAT, chatId);
    }
  }, []);

  const leaveChat = useCallback((chatId: string) => {
    if (socketRef.current?.connected && chatId) {
      console.log(`👋 Leaving chat room: ${chatId}`);
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
        console.log("📤 Sending message via socket:", messageData);
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
    socket,
    onlineUsers,
    sendMessage,
    joinChat,
    leaveChat,
    isConnected,
    updateUserStatus,
  };
}
