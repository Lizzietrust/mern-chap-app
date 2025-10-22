import React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onNextPage: () => void;
  onPrevPage: () => void;
  isLoading: boolean;
  isDark: boolean;
}

export const Pagination: React.FC<PaginationProps> = React.memo(
  ({ currentPage, totalPages, onNextPage, onPrevPage, isLoading, isDark }) => {
    if (totalPages <= 1) return null;

    const handlePrevClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("Prev button clicked", {
        currentPage,
        totalPages,
        isLoading,
      });
      if (currentPage > 1 && !isLoading) {
        console.log("Calling onPrevPage");
        onPrevPage();
      }
    };

    const handleNextClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("Next button clicked", {
        currentPage,
        totalPages,
        isLoading,
      });
      if (currentPage < totalPages && !isLoading) {
        console.log("Calling onNextPage");
        onNextPage();
      }
    };

    return (
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
        <button
          onClick={handlePrevClick}
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
          className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
        >
          Page {currentPage} of {totalPages}
        </span>

        <button
          onClick={handleNextClick}
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
    );
  }
);

Pagination.displayName = "Pagination";
