import React from "react";
import type { User } from "../../types/types";

interface MessageStatusProps {
  status: "sent" | "delivered" | "read";
  readBy?: string[] | User[];
  isDark: boolean;
}

export const MessageStatus: React.FC<MessageStatusProps> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case "read":
        return {
          icon: (
            <svg
              className="w-4 h-4 text-blue-500"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              {/* Eye icon for read status */}
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
            </svg>
          ),
          text: "Seen",
          color: "text-blue-500",
        };
      case "delivered":
        return {
          icon: (
            <svg
              className="w-4 h-4 text-green-500"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              {/* Double checkmark for delivered */}
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              <path
                d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
                transform="translate(-8 0)"
              />
            </svg>
          ),
          text: "Delivered",
          color: "text-green-500",
        };
      case "sent":
      default:
        return {
          icon: (
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {/* Single checkmark for sent */}
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ),
          text: "Sent",
          color: "text-gray-400",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="flex items-center space-x-1">
      <div className={`flex items-center ${config.color}`} title={config.text}>
        {config.icon}
      </div>
    </div>
  );
};
