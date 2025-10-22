import { useUsers } from "../useUsers";
import { useUserChats } from "../chats";
import { useChannels } from "../channels";
import { useCallback } from "react";
import type { UserChat, ChannelChat, Chat, User } from "../../types/types";

interface UseChatDataParams {
  currentPage: number;
  searchTerm: string;
  user: User | null;
}

export const useChatData = ({
  currentPage,
  searchTerm,
  user,
}: UseChatDataParams) => {
  const { data: usersData, isLoading: isLoadingUsers } = useUsers(
    currentPage,
    10,
    searchTerm
  );

  console.log(
    "useChatData - currentPage:",
    currentPage,
    "searchTerm:",
    searchTerm
  );
  console.log({ usersData });

  const {
    data: chats = [],
    isLoading: chatsLoading,
    isFetching: chatsFetching,
    refetch: refetchChats,
  } = useUserChats();

  const {
    data: channels = [],
    isLoading: channelsLoading,
    refetch: refetchChannels,
  } = useChannels();

  const removeDuplicateChats = useCallback(
    (chats: UserChat[]): UserChat[] => {
      const chatMap = new Map();

      chats.forEach((chat) => {
        if (!chat.participants || chat.participants.length === 0) {
          return;
        }

        const otherParticipant = chat.participants.find(
          (p) => p._id !== user?._id
        );

        if (!otherParticipant) {
          return;
        }

        const participantId = otherParticipant._id;
        const existingChat = chatMap.get(participantId);

        if (!existingChat) {
          chatMap.set(participantId, chat);
        } else {
          const existingTime = existingChat.lastMessageAt
            ? new Date(existingChat.lastMessageAt).getTime()
            : 0;
          const currentTime = chat.lastMessageAt
            ? new Date(chat.lastMessageAt).getTime()
            : 0;

          const existingCreated = new Date(
            existingChat.createdAt ?? new Date()
          ).getTime();
          const currentCreated = new Date(
            chat.createdAt ?? new Date()
          ).getTime();

          if (
            currentTime > existingTime ||
            (currentTime === existingTime && currentCreated > existingCreated)
          ) {
            chatMap.set(participantId, chat);
          }
        }
      });

      return Array.from(chatMap.values());
    },
    [user?._id]
  );

  const separateChats = useCallback((allChats: Chat[] = []) => {
    const directChats = allChats.filter(
      (chat) => chat?.type === "direct"
    ) as UserChat[];

    const channelChats = allChats.filter(
      (chat) => chat?.type === "channel"
    ) as ChannelChat[];

    return { directChats, channelChats };
  }, []);

  const { directChats, channelChats: separatedChannelChats } =
    separateChats(chats);
  const uniqueDirectChats = removeDuplicateChats(directChats);

  return {
    usersData,
    isLoadingUsers,
    chats,
    chatsLoading,
    chatsFetching,
    refetchChats,
    channels,
    channelsLoading,
    refetchChannels,
    uniqueDirectChats,
    separatedChannelChats,
    directChats,
  };
};
