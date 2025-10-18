import { useContext } from "react";
import { SocketContext } from "../contexts/socket/socket-context";

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
};
