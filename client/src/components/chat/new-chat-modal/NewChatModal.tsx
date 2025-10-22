import React from "react";
import { Modal } from "../../modals/Modal";
import { useNewChatModal } from "./useNewChatModal";
import { SearchInput } from "../../shared/search-input/SearchInput";
import { UserList } from "./UserList";
import { Pagination } from "../../shared/pagination/Pagination";
import type { NewChatModalProps } from "../../../types/NewChatModal.types";

const NewChatModal: React.FC<NewChatModalProps> = ({
  isDark,
  onClose,
  users,
  handleSelectUser,
  currentPage,
  totalUsers,
  onPageChange,
  onSearch,
  isLoading = false,
  searchTerm,
  onSearchTermChange,
  onNextPage,
  onPrevPage,
}) => {
  const { totalPages, handleUserSelect, clearSearch, handleSearchChange } =
    useNewChatModal({
      onClose,
      handleSelectUser,
      currentPage,
      totalUsers,
      onPageChange,
      onSearch,
      searchTerm,
      onSearchTermChange,
    });

  console.log("NewChatModal render", { currentPage, totalPages, totalUsers });

  return (
    <Modal isDark={isDark} onClose={onClose} title="New Chat" size="md">
      <div className="flex flex-col h-full">
        <SearchInput
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          onClearSearch={clearSearch}
          isDark={isDark}
          placeholder="Search users..."
        />

        <UserList
          users={users}
          isLoading={isLoading}
          searchTerm={searchTerm}
          onUserSelect={handleUserSelect}
          isDark={isDark}
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onNextPage={onNextPage}
          onPrevPage={onPrevPage}
          isLoading={isLoading}
          isDark={isDark}
        />
      </div>
    </Modal>
  );
};

export default React.memo(NewChatModal);
