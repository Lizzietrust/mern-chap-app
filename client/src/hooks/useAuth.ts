import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      // Clear user data from cache
      queryClient.removeQueries({ queryKey: authKeys.user() });
      // Redirect to login page
      navigate("/login", { replace: true });
    },
    onError: (error) => {
      console.error("Logout error:", error);
      // Even if logout fails on server, clear local state
      queryClient.removeQueries({ queryKey: authKeys.user() });
      navigate("/login", { replace: true });
    },
  });
}

// Hook to fetch current authenticated user (from cookie/session)
export function useMe(enabled: boolean = true) {
  return useQuery({
    queryKey: authKeys.user(),
    queryFn: authApi.me,
    enabled,
  });
}

// Hook to update user profile
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      firstName?: string;
      lastName?: string;
      image?: string;
      bio?: string;
      phone?: string;
      location?: string;
      website?: string;
    }) => authApi.updateProfile(data),
    onSuccess: (response: AuthResponse) => {
      // Update cached user info
      queryClient.setQueryData(authKeys.user(), response.user);
    },
  });
}
