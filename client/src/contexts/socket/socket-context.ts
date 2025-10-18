import { createContext } from "react";
import type { SocketContextType } from "../../types/socket";

export const SocketContext = createContext<SocketContextType | undefined>(
  undefined
);
