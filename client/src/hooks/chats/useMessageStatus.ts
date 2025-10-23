import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { messageApi } from "../../lib/api";
import { MESSAGE_KEYS } from "../../constants/chat";

export const useMarkMessageAsDelivered = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      return await messageApi.markAsDelivered(messageId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MESSAGE_KEYS.all });
    },
  });
};

export const useMarkMessageAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      return await messageApi.markAsRead(messageId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MESSAGE_KEYS.all });
    },
  });
};

export const useMessageStatus = (messageId: string) => {
  return useQuery({
    queryKey: MESSAGE_KEYS.status(messageId),
    queryFn: () => messageApi.getMessageStatus(messageId),
    enabled: !!messageId,
  });
};
