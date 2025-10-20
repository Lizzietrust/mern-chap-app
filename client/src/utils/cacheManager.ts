import { useQueryClient } from "@tanstack/react-query";
import type { QueryKey } from "@tanstack/react-query";
import { CACHE_KEYS } from "../constants/auth";
import { AUTH_KEYS } from "../constants/auth";
import type { User } from "../types/auth";

export function useCacheManager() {
  const queryClient = useQueryClient();

  const clearUserSpecificData = (): void => {
    Object.values(CACHE_KEYS).forEach((queryKey: QueryKey) => {
      if (queryKey !== CACHE_KEYS.USERS) {
        queryClient.removeQueries({ queryKey });
      }
    });

    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.USERS });
  };

  const clearAllUserData = (): void => {
    queryClient.removeQueries({ queryKey: AUTH_KEYS.USER() });

    clearUserSpecificData();
  };

  const updateUserData = (userData: User): void => {
    queryClient.setQueryData(AUTH_KEYS.USER(), userData);
  };

  return {
    clearUserSpecificData,
    clearAllUserData,
    updateUserData,
  };
}
