import React, { useMemo } from "react";
import { PlusIcon } from "@heroicons/react/24/solid";
import { ChannelItem } from "./ChannelItem";
import {
  formatLastMessageTime,
  getSenderDisplayName,
} from "../../../../utils/sidebar.utils";
import type {
  ChannelChat,
  ChatOrNull,
  User,
  Message,
} from "../../../../types/types";
import { useSocket } from "../../../../hooks/useSocket";

export interface ChannelListProps {
  isDark: boolean;
  channels: ChannelChat[];
  selectedChat: ChatOrNull;
  onChatSelect: (chat: ChatOrNull) => void;
  onCreateChannel: () => void;
  onShowChannelSettings: (channel: ChannelChat) => void;
  collapsed: boolean;
  getDisplayUnreadCount: (channel: ChannelChat) => number;
}

const isUserObject = (member: string | User): member is User => {
  return typeof member !== "string" && (member as User)._id !== undefined;
};

const getMemberId = (member: string | User): string => {
  return isUserObject(member) ? member._id : member;
};

const isMessageObject = (lastMessage: unknown): lastMessage is Message => {
  return (
    typeof lastMessage === "object" &&
    lastMessage !== null &&
    "_id" in lastMessage &&
    "messageType" in lastMessage
  );
};

const getMessagePreview = (message: Message): string => {
  if (message.isDeleted) {
    return "This message was deleted";
  }

  if (message.messageType === "image") {
    return "📷 Photo";
  }

  if (message.messageType === "file") {
    const fileMessage = message as Message & { fileName?: string };
    return `📎 ${fileMessage.fileName || "File"}`;
  }

  return message.content || "Message";
};

export const ChannelsList: React.FC<ChannelListProps> = React.memo(
  ({
    isDark,
    channels,
    selectedChat,
    onChatSelect,
    onCreateChannel,
    onShowChannelSettings,
    collapsed,
    getDisplayUnreadCount,
  }) => {
    const { onlineUsers } = useSocket();

    const updatedChannels = useMemo(() => {
      return channels.map((channel) => {
        if (channel.type === "channel" && channel.members) {
          return {
            ...channel,
            members: channel.members.map((member) => {
              const memberId = getMemberId(member);
              const onlineUser = onlineUsers.find((u) => u._id === memberId);

              if (isUserObject(member)) {
                return {
                  ...member,
                  isOnline: onlineUser?.isOnline || member.isOnline || false,
                  lastSeen: onlineUser?.lastSeen || member.lastSeen,
                };
              } else {
                const onlineUser = onlineUsers.find((u) => u._id === member);
                return {
                  _id: member,
                  firstName: "User",
                  lastName: "",
                  isOnline: onlineUser?.isOnline || false,
                  lastSeen: onlineUser?.lastSeen || new Date(),
                } as User;
              }
            }),
          };
        }
        return channel;
      });
    }, [channels, onlineUsers]);

    const getOnlineMemberCount = (channel: ChannelChat): number => {
      if (!channel.members || channel.members.length === 0) return 0;

      return channel.members.filter((member) => {
        const memberId = getMemberId(member);
        const onlineUser = onlineUsers.find((u) => u._id === memberId);
        return onlineUser?.isOnline || false;
      }).length;
    };

    const CreateChannelButton = () => (
      <button
        onClick={onCreateChannel}
        className={`w-full ${
          collapsed ? "p-1" : "p-3"
        } rounded-lg mb-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer border border-dashed ${
          isDark
            ? "border-gray-600 text-gray-300 hover:border-gray-500"
            : "border-gray-300 text-gray-600 hover:border-gray-400"
        }`}
      >
        <div
          className={`flex items-center ${
            collapsed ? "justify-center" : "space-x-3"
          }`}
        >
          <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center text-white font-semibold">
            <PlusIcon className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p
                className={`font-medium ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Create New Channel
              </p>
              <p
                className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Start a new channel conversation
              </p>
            </div>
          )}
        </div>
      </button>
    );

    const renderEmptyState = () => (
      <div
        className={`flex flex-col items-center justify-center p-8 text-center ${
          isDark ? "text-gray-400" : "text-gray-500"
        }`}
      >
        <div className="text-4xl mb-4">🏗️</div>
        <p className="text-sm mb-4">
          No channels yet. Create one to get started!
        </p>
        <button
          onClick={onCreateChannel}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isDark
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-blue-500 hover:bg-blue-600 text-white"
          }`}
        >
          Create Channel
        </button>
      </div>
    );

    if (collapsed) {
      if (channels.length === 0) {
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <CreateChannelButton />
            <div className="text-2xl mt-4">🏗️</div>
          </div>
        );
      }

      return (
        <div className="flex-1 overflow-y-auto py-2">
          <CreateChannelButton />
          {updatedChannels.slice(0, 8).map((channel) => {
            const unreadCount = getDisplayUnreadCount(channel);
            const isSelected = selectedChat?._id === channel._id;

            return (
              <ChannelItem
                key={channel._id}
                channel={channel}
                isSelected={isSelected}
                hasUnread={unreadCount > 0 && !isSelected}
                unreadCount={unreadCount}
                lastMessageTime=""
                displayText=""
                onSelect={() => onChatSelect(channel)}
                isDark={isDark}
                sidebarCollapsed={true}
                onShowSettings={() => onShowChannelSettings(channel)}
              />
            );
          })}
        </div>
      );
    }

    if (channels.length === 0) {
      return (
        <div className="flex-1 overflow-y-auto">
          <CreateChannelButton />
          {renderEmptyState()}
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          <CreateChannelButton />
          <div className="space-y-1">
            {updatedChannels.map((channel) => {
              const unreadCount = getDisplayUnreadCount(channel);
              const isSelected = selectedChat?._id === channel._id;
              const hasUnread = unreadCount > 0 && !isSelected;

              const lastMessageTime = channel.lastMessageAt
                ? formatLastMessageTime(channel.lastMessageAt)
                : "";

              const totalMembers = channel.members ? channel.members.length : 0;
              const onlineMembers = getOnlineMemberCount(channel);

              const getDisplayText = (): string => {
                if (channel.lastMessage) {
                  if (isMessageObject(channel.lastMessage)) {
                    const messagePreview = getMessagePreview(
                      channel.lastMessage
                    );

                    if (channel.lastMessageSender) {
                      const senderName = getSenderDisplayName(
                        channel.lastMessageSender
                      );
                      return `${messagePreview} • ${senderName}`;
                    }

                    return messagePreview;
                  } else if (typeof channel.lastMessage === "string") {
                    const messageText = channel.lastMessage;

                    if (channel.lastMessageSender) {
                      const senderName = getSenderDisplayName(
                        channel.lastMessageSender
                      );
                      return `${messageText} • ${senderName}`;
                    }

                    return messageText;
                  }
                }

                let displayText = `${totalMembers} members`;
                if (onlineMembers > 0) {
                  displayText += ` • ${onlineMembers} online`;
                }

                if (channel.description) {
                  displayText += ` • ${channel.description}`;
                }
                return displayText;
              };

              const displayText = getDisplayText();

              return (
                <ChannelItem
                  key={channel._id}
                  channel={channel}
                  isSelected={isSelected}
                  hasUnread={hasUnread}
                  unreadCount={unreadCount}
                  lastMessageTime={lastMessageTime}
                  displayText={displayText}
                  onSelect={() => onChatSelect(channel)}
                  isDark={isDark}
                  sidebarCollapsed={false}
                  onShowSettings={() => onShowChannelSettings(channel)}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  }
);

ChannelsList.displayName = "ChannelsList";
