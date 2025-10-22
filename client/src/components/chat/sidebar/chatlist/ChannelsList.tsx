import React, { useMemo } from "react";
import { PlusIcon } from "@heroicons/react/24/solid";
import { ChannelItem } from "./ChannelItem";
import {
  formatLastMessageTime,
  getSenderDisplayName,
} from "../../../../utils/sidebar.utils";
import type { ChannelChat, ChatOrNull, User } from "../../../../types/types";
import { useSocket } from "../../../../hooks/useSocket";

export interface ChannelListProps {
  isDark: boolean;
  channels: ChannelChat[];
  selectedChat: ChatOrNull;
  onChatSelect: (chat: ChatOrNull) => void;
  onCreateChannel: () => void;
  onShowChannelSettings: () => void;
  collapsed: boolean;
  getDisplayUnreadCount: (channel: ChannelChat) => number;
}

const isUserObject = (member: string | User): member is User => {
  return typeof member !== "string" && (member as User)._id !== undefined;
};

const getMemberId = (member: string | User): string => {
  return isUserObject(member) ? member._id : member;
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

    if (channels.length === 0) {
      return (
        <div className="p-2">
          <CreateChannelButton />
          <div
            className={`text-center py-8 ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            <div className="text-4xl mb-4">🏗️</div>
            <p>No channels yet</p>
            <p className="text-sm mt-1">
              Create your first channel to get started
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="p-2">
        <CreateChannelButton />

        {updatedChannels.map((channel) => {
          const unreadCount = getDisplayUnreadCount(channel);
          const isSelected = selectedChat?._id === channel._id;
          const hasUnread = unreadCount > 0 && !isSelected;
          const lastMessageTime = formatLastMessageTime(channel.lastMessageAt);
          const totalMembers = channel.members ? channel.members.length : 0;
          const onlineMembers = getOnlineMemberCount(channel);

          const getDisplayText = (): string => {
            if (channel.lastMessage) {
              if (channel.lastMessageSender) {
                const senderName = getSenderDisplayName(
                  channel.lastMessageSender
                );
                return `${channel.lastMessage} • ${senderName}`;
              }

              return channel.lastMessage;
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
              sidebarCollapsed={collapsed}
              onShowSettings={onShowChannelSettings}
            />
          );
        })}
      </div>
    );
  }
);

ChannelsList.displayName = "ChannelsList";
