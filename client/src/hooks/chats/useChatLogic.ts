import { useState, useCallback, useContext } from "react";
import { useApp } from "../../contexts/appcontext/index";
import { SelectedChatContext } from "../../contexts/selectedChatContext/SelectedChatContext";
import type {
  SelectedChatContextType,
//   Chat,
//   UserChat,
} from "../../types/types";

export const useChatLogic = () => {
  const { state } = useApp();
  const { selectedChat, setSelectedChat } = useContext(
    SelectedChatContext
  ) as SelectedChatContextType;

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleSearch = useCallback((search: string) => {
    setSearchTerm(search);
    setCurrentPage(1);
  }, []);

  return {
    user: state.user,
    selectedChat,
    setSelectedChat,
    currentPage,
    searchTerm,
    handlePageChange,
    handleSearch,
  };
};
