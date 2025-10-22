import React from "react";
import { DirectMessagesList } from "./DirectMessagesList";
import { ChannelsList } from "./ChannelsList";
import type { ChatListProps } from "../../../../types/Sidebar.types";

export const ChatList: React.FC<ChatListProps> = ({
  isDark,
  sidebarCollapsed,
  activeTab,
  selectedChat,
  onChatSelect,
  onCreateChannel,
  onShowChannelSettings,
  directChats,
  channels,
  getDisplayUnreadCount,
  getChannelDisplayUnreadCount,
}) => {
  if (sidebarCollapsed) {
    return (
      <div className="flex-1 overflow-y-auto">
        {activeTab === "direct" && (
          <DirectMessagesList
            isDark={isDark}
            chats={directChats}
            selectedChat={selectedChat}
            onChatSelect={onChatSelect}
            collapsed={true}
            getDisplayUnreadCount={getDisplayUnreadCount}
          />
        )}
        {activeTab === "channels" && (
          <ChannelsList
            isDark={isDark}
            channels={channels}
            selectedChat={selectedChat}
            onChatSelect={onChatSelect}
            onCreateChannel={onCreateChannel}
            onShowChannelSettings={onShowChannelSettings} 
            collapsed={true}
            getDisplayUnreadCount={getChannelDisplayUnreadCount}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {activeTab === "direct" && (
        <DirectMessagesList
          isDark={isDark}
          chats={directChats}
          selectedChat={selectedChat}
          onChatSelect={onChatSelect}
          collapsed={false}
          getDisplayUnreadCount={getDisplayUnreadCount}
        />
      )}
      {activeTab === "channels" && (
        <ChannelsList
          isDark={isDark}
          channels={channels}
          selectedChat={selectedChat}
          onChatSelect={onChatSelect}
          onCreateChannel={onCreateChannel}
          onShowChannelSettings={onShowChannelSettings}
          collapsed={false}
          getDisplayUnreadCount={getChannelDisplayUnreadCount}
        />
      )}
    </div>
  );
};
