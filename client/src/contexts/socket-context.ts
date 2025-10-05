import { createContext } from "react";
import type { SocketContextType } from "./SocketContext";

export const SocketContext = createContext<SocketContextType | undefined>(
  undefined
);
