import { createContext } from "react";

export interface ChatContextType {
  activeTab: "direct" | "channels";
  setActiveTab: (tab: "direct" | "channels") => void;
}

export const ChatContext = createContext<ChatContextType | undefined>(
  undefined
);
