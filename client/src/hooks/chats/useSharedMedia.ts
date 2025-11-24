import { useQuery } from "@tanstack/react-query";
import { chatApi } from "../../lib/api";

export function useSharedMedia(userId1?: string, userId2?: string) {
  return useQuery({
    queryKey: ["sharedMedia", userId1, userId2],
    queryFn: async () => {
      if (!userId1 || !userId2) return [];
      return await chatApi.getSharedMedia(userId1, userId2);
    },
    enabled: !!userId1 && !!userId2,
    staleTime: 5 * 60 * 1000,
  });
}
