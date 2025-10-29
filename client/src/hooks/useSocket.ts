import { useContext } from "react";
import { useApp } from "../contexts/appcontext/index";
import { SocketContext } from "../contexts/socket/socket-context";
import type { SocketContextType } from "../types/socket";
import type { Socket } from "socket.io-client";
import type { User } from "../types/types";

export const useSocket = (): SocketContextType & {
  socket: Socket | null;
  onlineUsers: User[];
  isConnected: boolean;
} => {
  const { state } = useApp();
  const socketContext = useContext(SocketContext);

  if (!socketContext) {
    throw new Error("useSocket must be used within SocketProvider");
  }

  const onlineUsers = Array.isArray(state.onlineUsers) ? state.onlineUsers : [];

  return {
    ...socketContext,
    socket: state.socket,
    onlineUsers,
    isConnected: socketContext.isConnected,
  };
};

export { SocketProvider } from "../contexts/socket/SocketProvider";
