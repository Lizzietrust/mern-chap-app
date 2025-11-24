
import { useQuery } from "@tanstack/react-query";
import { channelApi } from "../../lib/api";

export const useCommonChannels = (userId1: string, userId2: string) => {
  return useQuery({
    queryKey: ["common-channels", userId1, userId2],
    queryFn: () => channelApi.getCommonChannels(userId1, userId2),
    enabled: !!userId1 && !!userId2,
  });
};
