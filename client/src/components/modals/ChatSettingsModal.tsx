import React from "react";

interface ChatSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isChannel: boolean | null;
  onOptionSelect: (option: string) => void;
  isDark: boolean;
}

const ChatSettingsModal: React.FC<ChatSettingsModalProps> = ({
  isOpen,
  onClose,
  isChannel = false,
  onOptionSelect,
  isDark,
}) => {
  if (!isOpen) return null;

  const options = [
    { id: "clear", label: "Clear chat history", icon: "🧹" },
    { id: "theme", label: "Change chat theme", icon: "🎨" },
    ...(isChannel ? [] : [{ id: "export", label: "Export chat", icon: "📤" }]),
    { id: "block", label: "Block user", icon: "🚫" },
    { id: "delete", label: "Delete chat", icon: "🗑️" },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`rounded-lg shadow-xl w-full max-w-md ${
          isDark ? "bg-gray-800 text-white" : "bg-white text-gray-900"
        }`}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">Chat Settings</h2>
        </div>

        <div className="p-2">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => onOptionSelect(option.id)}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              <span className="text-xl">{option.icon}</span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
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
        </div>
      </div>
    </div>
  );
};

export default ChatSettingsModal;
