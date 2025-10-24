import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChatService } from "./chatService";
import { MESSAGE_KEYS } from "../../constants/chat";
import type {
  EditMessageData,
  DeleteMessageData,
  Message,
} from "../../types/types";

const getMessageChatId = (message: Message): string => {
  if (typeof message.chat === "string") {
    return message.chat;
  } else {
    return message.chat._id;
  }
};

export const useEditMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, content }: EditMessageData) =>
      ChatService.editMessage(messageId, content),
    onSuccess: (updatedMessage) => {
      const chatId = getMessageChatId(updatedMessage);

      const messagesQueryKey = MESSAGE_KEYS.list(chatId);

      queryClient.setQueryData<Message[]>(
        messagesQueryKey,
        (oldMessages = []) =>
          oldMessages.map((msg) =>
            msg._id === updatedMessage._id ? updatedMessage : msg
          )
      );
    },
  });
};

export const useDeleteMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, deleteForEveryone = false }: DeleteMessageData) =>
      ChatService.deleteMessage(messageId, deleteForEveryone),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: MESSAGE_KEYS.all,
      });
    },
  });
};
