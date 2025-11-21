import { useQuery, useQueryClient } from "@tanstack/react-query";
import { userApi } from "../../lib/api";
import type { User } from "../../types/types";

export const useUserProfile = (userId?: string) => {
  return useQuery({
    queryKey: ["userProfile", userId],
    queryFn: async (): Promise<User> => {
      if (!userId) {
        throw new Error("User ID is required");
      }
      return await userApi.getUserProfile(userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
};

export const useUpdateUserProfileCache = () => {
  const queryClient = useQueryClient();

  const updateUserProfileCache = (userId: string, updates: Partial<User>) => {
    console.log("🔄 Updating cache for user:", userId, updates);

    queryClient.setQueryData(
      ["userProfile", userId],
      (oldData: User | undefined) => {
        if (!oldData) {
          console.log("❌ No old data found for user:", userId);
          return oldData;
        }

        const newData = { ...oldData, ...updates };
        console.log("✅ Cache updated:", { old: oldData, new: newData });
        return newData;
      }
    );

    queryClient.invalidateQueries({
      queryKey: ["userProfile", userId],
      refetchType: "active",
    });
  };

  const invalidateUserProfile = (userId: string) => {
    queryClient.invalidateQueries({ queryKey: ["userProfile", userId] });
  };

  return { updateUserProfileCache, invalidateUserProfile };
};
