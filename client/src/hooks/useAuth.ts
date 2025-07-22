import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  authApi,
  type RegisterRequest,
  type LoginRequest,
  type AuthResponse,
} from "../lib/api";

// Query keys for auth
export const authKeys = {
  all: ["auth"] as const,
  user: () => [...authKeys.all, "user"] as const,
};

// Hook to register a new user
export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: (response: AuthResponse) => {
      // Store user data in cache
      queryClient.setQueryData(authKeys.user(), response.user);
    },
  });
}

// Hook to login user
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (response: AuthResponse) => {
      // Store user data in cache
      queryClient.setQueryData(authKeys.user(), response.user);
    },
  });
}

// Hook to logout user
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      // Clear user data from cache
      queryClient.removeQueries({ queryKey: authKeys.user() });
    },
  });
}
