import React from "react";
import type { Chat } from "../../types/types";

export type SelectedChatContextType = {
  selectedChat: Chat | null;
  setSelectedChat: React.Dispatch<React.SetStateAction<Chat | null>>;
  clearSelectedChat: () => void;
};

export const SelectedChatContext =
  React.createContext<SelectedChatContextType | null>(null);
