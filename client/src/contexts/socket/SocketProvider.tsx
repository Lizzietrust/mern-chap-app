import type { ReactNode } from "react";
import { SocketContext } from "./socket-context";
import { useSocketLogic } from "../../hooks/useSocketLogic";

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const socketLogic = useSocketLogic();

  return (
    <SocketContext.Provider value={socketLogic}>
      {children}
    </SocketContext.Provider>
  );
}
