import React, { useContext } from "react";
import type { Chat } from "../types/types";

type SelectedChatContextType = {
  selectedChat: Chat | null;
  setSelectedChat: React.Dispatch<React.SetStateAction<Chat | null>>;
  clearSelectedChat: () => void;
};

export const SelectedChatContext =
  React.createContext<SelectedChatContextType | null>(null);

export const SelectedChatProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [selectedChat, setSelectedChat] = React.useState<Chat | null>(() => {
    const storedChat = localStorage.getItem("selectedChat");
    return storedChat ? JSON.parse(storedChat) : null;
  });

  const clearSelectedChat = () => {
    setSelectedChat(null);
    localStorage.removeItem("selectedChat");
  };

  React.useEffect(() => {
    if (selectedChat) {
      localStorage.setItem("selectedChat", JSON.stringify(selectedChat));
    } else {
      localStorage.removeItem("selectedChat");
    }
  }, [selectedChat]);

  return (
    <SelectedChatContext.Provider
      value={{ selectedChat, setSelectedChat, clearSelectedChat }}
    >
      {children}
    </SelectedChatContext.Provider>
  );
};

export const useSelectedChat = () => {
  const context = useContext(SelectedChatContext);
  if (!context) {
    throw new Error(
      "useSelectedChat must be used within a SelectedChatProvider"
    );
  }
  return context;
};
