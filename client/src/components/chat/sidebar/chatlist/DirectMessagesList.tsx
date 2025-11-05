import React from "react";
import { ChatItem } from "./ChatItem";
import {
  getOtherParticipant,
  getDisplayName,
  formatLastMessageTime,
} from "../../../../utils/sidebar.utils";
import { useApp } from "../../../../contexts/appcontext/index";
import type { UserChat, ChatOrNull } from "../../../../types/types";

interface DirectMessagesListProps {
  isDark: boolean;
  chats: UserChat[];
  selectedChat: ChatOrNull;
  onChatSelect: (chat: ChatOrNull) => void;
  collapsed: boolean;
  getDisplayUnreadCount: (chat: UserChat) => number;
}

const getLastMessage = (chat: UserChat): string => {
  if (chat.lastMessage && chat.lastMessage.trim()) {
    return chat.lastMessage.length > 50
      ? chat.lastMessage.substring(0, 50) + "..."
      : chat.lastMessage;
  }

  if (chat.participants && chat.participants.length > 0) {
    return "Start a conversation";
  }

  return "No messages yet";
};

export const DirectMessagesList: React.FC<DirectMessagesListProps> = React.memo(
  ({
    isDark,
    chats,
    selectedChat,
    onChatSelect,
    collapsed,
    getDisplayUnreadCount,
  }) => {
    const { state } = useApp();

    const renderEmptyState = () => (
      <div
        className={`flex flex-col items-center justify-center p-8 text-center ${
          isDark ? "text-gray-400" : "text-gray-500"
        }`}
      >
        <div className="text-4xl mb-4">💬</div>
        <p className="text-sm mb-4">No direct messages yet</p>
      </div>
    );

    if (collapsed) {
      if (chats.length === 0) {
        return (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-2xl">💬</div>
          </div>
        );
      }

      return (
        <div className="flex-1 overflow-y-auto py-2">
          {chats.slice(0, 8).map((chat) => {
            const otherParticipant = getOtherParticipant(chat, state.user?._id);
            const unreadCount = getDisplayUnreadCount(chat);
            const isSelected = selectedChat?._id === chat._id;

            const displayName = otherParticipant
              ? getDisplayName(otherParticipant)
              : "Unknown User";

            const isOnline = otherParticipant?.isOnline || false;
            const userImage = otherParticipant?.image;
            const initials =
              otherParticipant?.firstName?.charAt(0) ||
              otherParticipant?.name?.charAt(0) ||
              "U";

            return (
              <ChatItem
                key={chat._id}
                chat={chat}
                isSelected={isSelected}
                hasUnread={unreadCount > 0 && !isSelected}
                unreadCount={unreadCount}
                displayName={displayName}
                lastMessage=""
                lastMessageTime=""
                isOnline={isOnline}
                userImage={userImage}
                initials={initials}
                onSelect={() => onChatSelect(chat)}
                isDark={isDark}
                sidebarCollapsed={true}
              />
            );
          })}
        </div>
      );
    }

    if (chats.length === 0) {
      return renderEmptyState();
    }

    return (
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-1">
          {chats.map((chat) => {
            const otherParticipant = getOtherParticipant(chat, state.user?._id);
            const unreadCount = getDisplayUnreadCount(chat);
            const isSelected = selectedChat?._id === chat._id;
            const hasUnread = unreadCount > 0 && !isSelected;

            const displayName = otherParticipant
              ? getDisplayName(otherParticipant)
              : "Unknown User";

            const lastMessage = getLastMessage(chat);
            const lastMessageTime = formatLastMessageTime(chat.lastMessageAt);

            const isOnline = otherParticipant?.isOnline || false;
            const userImage = otherParticipant?.image;
            const initials =
              otherParticipant?.firstName?.charAt(0) ||
              otherParticipant?.name?.charAt(0) ||
              "U";

            return (
              <ChatItem
                key={chat._id}
                chat={chat}
                isSelected={isSelected}
                hasUnread={hasUnread}
                unreadCount={unreadCount}
                displayName={displayName}
                lastMessage={lastMessage}
                lastMessageTime={lastMessageTime}
                isOnline={isOnline}
                userImage={userImage}
                initials={initials}
                onSelect={() => onChatSelect(chat)}
                isDark={isDark}
                sidebarCollapsed={false}
              />
            );
          })}
        </div>
      </div>
    );
  }
);

DirectMessagesList.displayName = "DirectMessagesList";
