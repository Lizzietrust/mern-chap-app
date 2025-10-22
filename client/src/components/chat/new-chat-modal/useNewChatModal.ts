import { useCallback } from "react";
import type { NewChatModalProps } from "../../../types/NewChatModal.types";

export const useNewChatModal = ({
  onClose,
  handleSelectUser,
  currentPage,
  totalUsers,
  onPageChange,
  onSearch,
  //   searchTerm,
  onSearchTermChange,
}: Pick<
  NewChatModalProps,
  | "onClose"
  | "handleSelectUser"
  | "currentPage"
  | "totalUsers"
  | "onPageChange"
  | "onSearch"
  | "searchTerm"
  | "onSearchTermChange"
>) => {
  const limit = 10;
  const totalPages = Math.ceil(totalUsers / limit);

  const handleUserSelect = useCallback(
    (userId: string) => {
      handleSelectUser(userId);
      onClose();
    },
    [handleSelectUser, onClose]
  );

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  }, [currentPage, totalPages, onPageChange]);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  }, [currentPage, onPageChange]);

  const clearSearch = useCallback(() => {
    onSearchTermChange("");
    onSearch("");
  }, [onSearchTermChange, onSearch]);

  const handleSearchChange = useCallback(
    (value: string) => {
      onSearchTermChange(value);
      onSearch(value);
    },

    [onSearchTermChange, onSearch]
  );

  return {
    totalPages,
    handleUserSelect,
    handleNextPage,
    handlePrevPage,
    clearSearch,
    handleSearchChange,
  };
};
