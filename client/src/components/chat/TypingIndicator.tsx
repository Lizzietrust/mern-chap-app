import React from "react";

interface TypingIndicatorProps {
  isDark: boolean;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = React.memo(
  ({ isDark }) => {
    return (
      <div className="flex justify-start">
        <div
          className={`max-w-xs px-4 py-2 rounded-lg ${
            isDark
              ? "bg-gray-700 text-white"
              : "bg-white text-gray-900 border border-gray-200"
          }`}
        >
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </div>
            <span
              className={`text-xs ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              typing...
            </span>
          </div>
        </div>
      </div>
    );
  }
);

TypingIndicator.displayName = "TypingIndicator";

export default TypingIndicator;
