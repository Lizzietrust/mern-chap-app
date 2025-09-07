import { useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../lib/api';

export const chatKeys = {
  all: ['chats'] as const,
  lists: () => [...chatKeys.all, 'list'] as const,
  list: (filters: string) => [...chatKeys.lists(), { filters }] as const,
  details: () => [...chatKeys.all, 'detail'] as const,
  detail: (id: number) => [...chatKeys.details(), id] as const,
};

export function useCreateChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: chatApi.createChat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
    },
  });
}
