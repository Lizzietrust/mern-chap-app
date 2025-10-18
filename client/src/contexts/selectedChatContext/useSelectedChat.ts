import { useContext } from "react";
import { SelectedChatContext } from "./SelectedChatContext";
import type { SelectedChatContextType } from "../../types/types";

export function useSelectedChat(): SelectedChatContextType {
  const context = useContext(SelectedChatContext);

  if (!context) {
    throw new Error(
      "useSelectedChat must be used within a SelectedChatProvider"
    );
  }

  return context;
}

export function useSelectedChatState() {
  const { selectedChat, setSelectedChat } = useSelectedChat();
  return { selectedChat, setSelectedChat };
}

export function useSelectedChatActions() {
  const { setSelectedChat, clearSelectedChat } = useSelectedChat();
  return { setSelectedChat, clearSelectedChat };
}
