import { useSocket } from "../contexts/useSocket";

export const useUserStatus = (userId: string) => {
  const { onlineUsers } = useSocket();
  const isOnline = onlineUsers.some((u) => u._id === userId);
  return { isOnline };
};
