import type { User } from "./types";

export interface NewChatModalProps {
  isOpen: boolean;
  isDark: boolean;
  onClose: () => void;
  users: User[];
  handleSelectUser: (userId: string) => void;
  currentPage: number;
  totalUsers: number;
  onPageChange: (page: number) => void;
  onSearch: (searchTerm: string) => void;
  isLoading?: boolean;
  searchTerm: string;
  onSearchTermChange: (searchTerm: string) => void;
  onNextPage: () => void;
  onPrevPage: () => void;
}

export interface SearchInputProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  isDark: boolean;
  placeholder?: string;
}

export interface UserListProps {
  users: User[];
  isLoading: boolean;
  searchTerm: string;
  onUserSelect: (userId: string) => void;
  isDark: boolean;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onNextPage: () => void;
  onPrevPage: () => void;
  isLoading: boolean;
  isDark: boolean;
}

export interface UserItemProps {
  user: User;
  onSelect: (userId: string) => void;
  isDark: boolean;
}
