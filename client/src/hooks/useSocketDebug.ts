// hooks/useSocketDebug.ts
import { useEffect, useState } from "react";
import { useSocket } from "../contexts/useSocket";

export const useSocketDebug = () => {
  const { socket, isConnected, onlineUsers } = useSocket();
  const [socketEvents, setSocketEvents] = useState<string[]>([]);

  useEffect(() => {
    if (!socket) return;

    const eventHandlers = {
      connect: () => addEvent("🟢 connect"),
      disconnect: () => addEvent("🔴 disconnect"),
      onlineUsers: (data: any) =>
        addEvent(`📋 onlineUsers: ${data.length} users`),
      userOnline: (data: any) => addEvent(`🟢 userOnline: ${data.userId}`),
      userOffline: (data: any) => addEvent(`🔴 userOffline: ${data.userId}`),
      testResponse: (data: any) => addEvent(`🧪 testResponse: ${data.message}`),
    };

    // Register all event listeners
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      // Clean up event listeners
      Object.entries(eventHandlers).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
    };
  }, [socket]);

  const addEvent = (event: string) => {
    setSocketEvents((prev) => [
      ...prev.slice(-9),
      `${new Date().toLocaleTimeString()}: ${event}`,
    ]);
  };

  const clearEvents = () => setSocketEvents([]);

  return {
    socketEvents,
    clearEvents,
    isConnected,
    onlineUsers,
    socketId: socket?.id,
  };
};
