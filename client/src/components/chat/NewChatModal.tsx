import {
  XMarkIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/solid";
import type { User } from "../../types";

interface Props {
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
}

const NewChatModal = ({
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
}: Props) => {
  const limit = 10;
  const totalPages = Math.ceil(totalUsers / limit);

  const handleUserSelect = (userId: string) => {
    handleSelectUser(userId);
    onClose();
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const clearSearch = () => {
    onSearchTermChange("");
    onSearch(""); // Also clear the search in the API
  };

  const handleSearchChange = (value: string) => {
    onSearchTermChange(value); // Update UI immediately
    onSearch(value); // Trigger API search immediately
  };

  return (
    <div
      className="fixed inset-0 bg-white/50 bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className={`${
          isDark ? "bg-gray-800" : "bg-white"
        } rounded-lg p-6 w-full max-w-md max-h-[80vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2
            className={`text-xl font-bold ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            New Chat
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${
              isDark ? "text-gray-300" : "text-gray-600"
            }`}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative mb-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDark
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
              }`}
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : users.length > 0 ? (
            users.map((user) => (
              <button
                key={user._id}
                onClick={() => handleUserSelect(user._id)}
                className={`w-full p-3 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                    {user.image ? (
                      <img
                        className="w-10 h-10 rounded-full"
                        src={user.image}
                        alt="User avatar"
                      />
                    ) : (
                      <div>{user.firstName?.charAt(0) || "U"}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p
                      className={`text-sm truncate ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {user.email}
                    </p>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <p
              className={`text-center py-8 ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {searchTerm
                ? "No users found matching your search"
                : "No users found"}
            </p>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1 || isLoading}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                currentPage === 1 || isLoading
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              } ${isDark ? "text-gray-300" : "text-gray-600"}`}
            >
              <ChevronLeftIcon className="h-4 w-4" />
              <span>Previous</span>
            </button>

            <span
              className={`text-sm ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages || isLoading}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                currentPage === totalPages || isLoading
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              } ${isDark ? "text-gray-300" : "text-gray-600"}`}
            >
              <span>Next</span>
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewChatModal;
