import { useMutation, useQueryClient } from "@tanstack/react-query";
import { chatApi } from "../../lib/api";
import { MESSAGE_KEYS, CHAT_KEYS } from "../../constants/chat";
import { useNotifications } from "../../contexts";

interface ClearChatVariables {
  chatId: string;
  deleteForEveryone?: boolean;
}

interface ClearChatResponse {
  message: string;
  chatId: string;
  deletedForEveryone?: boolean;
}

export const useClearChat = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  const clearChatMutation = useMutation<
    ClearChatResponse,
    Error,
    ClearChatVariables
  >({
    mutationFn: async ({
      chatId,
      deleteForEveryone = false,
    }: ClearChatVariables) => {
      return await chatApi.clearChatMessages(chatId, deleteForEveryone);
    },
    onSuccess: (variables: ClearChatVariables) => {
      const { chatId, deleteForEveryone = false } = variables;

      queryClient.invalidateQueries({
        queryKey: MESSAGE_KEYS.list(chatId),
      });

      queryClient.invalidateQueries({
        queryKey: CHAT_KEYS.userChats(),
      });

      success(
        deleteForEveryone ? "Chat cleared for everyone" : "Chat cleared for you"
      );
    },
    onError: (err: Error) => {
      console.error("Failed to clear chat:", err);
      error("Failed to clear chat. Please try again.");
    },
  });

  return clearChatMutation;
};
