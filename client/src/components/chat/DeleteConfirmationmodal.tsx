import type React from "react";

export const DeleteConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  deleteForEveryone: boolean;
  isDark: boolean;
  isLoading?: boolean;
}> = ({
  isOpen,
  onClose,
  onConfirm,
  deleteForEveryone,
  isDark,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`w-full max-w-md rounded-xl shadow-2xl ${
          isDark ? "bg-gray-800" : "bg-white"
        }`}
      >
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isDark ? "bg-red-900 bg-opacity-20" : "bg-red-100"
                }`}
              >
                <svg
                  className={`w-6 h-6 ${
                    isDark ? "text-red-400" : "text-red-600"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3
                className={`text-lg font-semibold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Delete Message
              </h3>
              <p
                className={`text-sm ${
                  isDark ? "text-gray-300" : "text-gray-600"
                }`}
              >
                {deleteForEveryone
                  ? "This will delete the message for all participants. This action cannot be undone."
                  : "This will delete the message only for you. Other participants will still see it."}
              </p>
            </div>
          </div>

          <div className="flex space-x-3 justify-end">
            <button
              onClick={onClose}
              disabled={isLoading}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                isDark
                  ? "bg-gray-700 text-gray-200 hover:bg-gray-600 disabled:opacity-50"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
              }`}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                isDark
                  ? "bg-red-600 hover:bg-red-700 disabled:bg-red-400"
                  : "bg-red-600 hover:bg-red-700 disabled:bg-red-400"
              } disabled:opacity-50`}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Deleting...
                </div>
              ) : (
                "Delete"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};