import React from "react";
import { DirectMessagesList } from "./DirectMessagesList";
import { ChannelsList } from "./ChannelsList";
import type { ChatListProps } from "../../../../types/Sidebar.types";

export const ChatList: React.FC<ChatListProps> = React.memo(
  ({
    isDark,
    sidebarCollapsed,
    activeTab,
    selectedChat,
    onChatSelect,
    onCreateChannel,
    directChats,
    channels,
    getDisplayUnreadCount,
    getChannelDisplayUnreadCount,
  }) => {
    return (
      <div
        className={`flex-1 overflow-y-auto ${
          sidebarCollapsed ? "hidden md:block" : ""
        }`}
      >
        {activeTab === "dms" && (
          <DirectMessagesList
            isDark={isDark}
            sidebarCollapsed={sidebarCollapsed}
            selectedChat={selectedChat}
            directChats={directChats}
            onChatSelect={onChatSelect}
            getDisplayUnreadCount={getDisplayUnreadCount}
          />
        )}

        {activeTab === "channels" && (
          <ChannelsList
            isDark={isDark}
            sidebarCollapsed={sidebarCollapsed}
            selectedChat={selectedChat}
            channels={channels}
            onChatSelect={onChatSelect}
            onCreateChannel={onCreateChannel}
            getChannelDisplayUnreadCount={getChannelDisplayUnreadCount}
          />
        )}
      </div>
    );
  }
);

ChatList.displayName = "ChatList";
