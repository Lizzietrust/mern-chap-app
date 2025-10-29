import React from "react";

interface ClearChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (deleteForEveryone: boolean) => void;
  isDark: boolean;
  isChannel: boolean | null;
  isAdmin: boolean | null;
  isCreator: boolean | null;
}

const ClearChatModal: React.FC<ClearChatModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isDark,
  isChannel = false,
  isAdmin = false,
  isCreator = false,
}) => {
  if (!isOpen) return null;

  const canClearForEveryone = isChannel && (isAdmin || isCreator);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`rounded-lg shadow-xl w-full max-w-md ${
          isDark ? "bg-gray-800 text-white" : "bg-white text-gray-900"
        }`}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">Clear Chat History</h2>
        </div>

        <div className="p-4">
          <p className="mb-4 text-sm">
            {canClearForEveryone
              ? "Choose how you want to clear the chat history:"
              : "This will clear the chat history only for you. Other participants will still see the messages."}
          </p>

          {canClearForEveryone && (
            <div className="space-y-2 mb-4">
              <div className="text-sm p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
                <strong>Clear for me:</strong> Only you will see an empty chat
              </div>
              <div className="text-sm p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
                <strong>Clear for everyone:</strong> All members will see an
                empty chat
              </div>
            </div>
          )}

          <p className="text-sm text-red-500 dark:text-red-400 font-medium">
            This action cannot be undone.
          </p>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg ${
              isDark
                ? "bg-gray-700 hover:bg-gray-600 text-white"
                : "bg-gray-200 hover:bg-gray-300 text-gray-900"
            } transition-colors`}
          >
            Cancel
          </button>

          <div className="space-x-2">
            <button
              onClick={() => onConfirm(false)}
              className={`px-4 py-2 rounded-lg ${
                isDark
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              } transition-colors`}
            >
              Clear for me
            </button>

            {canClearForEveryone && (
              <button
                onClick={() => onConfirm(true)}
                className={`px-4 py-2 rounded-lg ${
                  isDark
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-red-500 hover:bg-red-600 text-white"
                } transition-colors`}
              >
                Clear for everyone
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClearChatModal;
