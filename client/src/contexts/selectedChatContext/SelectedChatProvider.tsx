import React, { useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import { SelectedChatContext } from "./SelectedChatContext";
import type { SelectedChatContextType, Chat } from "../../types/types";

interface SelectedChatProviderProps {
  children: ReactNode;
}

export function SelectedChatProvider({ children }: SelectedChatProviderProps) {
  const [selectedChat, setSelectedChat] = React.useState<Chat | null>(() => {
    try {
      const storedChat = localStorage.getItem("selectedChat");
      return storedChat ? JSON.parse(storedChat) : null;
    } catch (error) {
      console.error("Error loading selected chat from localStorage:", error);
      return null;
    }
  });

  const clearSelectedChat = useCallback(() => {
    setSelectedChat(null);
    try {
      localStorage.removeItem("selectedChat");
    } catch (error) {
      console.error("Error clearing selected chat from localStorage:", error);
    }
  }, []);

  const handleSetSelectedChat = useCallback<
    React.Dispatch<React.SetStateAction<Chat | null>>
  >((chat) => {
    setSelectedChat(chat);
  }, []);

  React.useEffect(() => {
    if (selectedChat) {
      try {
        localStorage.setItem("selectedChat", JSON.stringify(selectedChat));
      } catch (error) {
        console.error("Error saving selected chat to localStorage:", error);
      }
    } else {
      try {
        localStorage.removeItem("selectedChat");
      } catch (error) {
        console.error("Error removing selected chat from localStorage:", error);
      }
    }
  }, [selectedChat]);

  const value: SelectedChatContextType = useMemo(
    () => ({
      selectedChat,
      setSelectedChat: handleSetSelectedChat,
      clearSelectedChat,
    }),
    [selectedChat, handleSetSelectedChat, clearSelectedChat]
  );

  return (
    <SelectedChatContext.Provider value={value}>
      {children}
    </SelectedChatContext.Provider>
  );
}
