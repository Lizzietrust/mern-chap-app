import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { authApi, type RegisterRequest, type LoginRequest } from "../lib/api";
import type { AuthResponse } from "../types";
import { useApp } from "../contexts/AppContext";
import { useSocket } from "../contexts/useSocket";

// Query keys for auth
export const authKeys = {
  all: ["auth"] as const,
  user: () => [...authKeys.all, "user"] as const,
};

// Helper function to clear user-specific data (chats, messages, etc.)
function clearUserSpecificData(queryClient: ReturnType<typeof useQueryClient>) {
  // Invalidate and remove all chat-related queries
  queryClient.removeQueries({ queryKey: ["chats"] });
  queryClient.removeQueries({ queryKey: ["messages"] });
  queryClient.removeQueries({ queryKey: ["userChats"] });

  // Invalidate users list (optional, depends on your app)
  queryClient.invalidateQueries({ queryKey: ["users"] });

  // Clear any socket-related data if stored in cache
  queryClient.removeQueries({ queryKey: ["socket"] });
}

// Helper function to clear ALL user data (for logout)
function clearAllUserData(queryClient: ReturnType<typeof useQueryClient>) {
  // Clear auth user data
  queryClient.removeQueries({ queryKey: authKeys.user() });

  // Clear all user-specific data
  clearUserSpecificData(queryClient);

  // Optional: Clear other user-specific cache if needed
  queryClient.removeQueries({ queryKey: ["notifications"] });
  queryClient.removeQueries({ queryKey: ["settings"] });
}

// Hook to register a new user
export function useRegister() {
  const queryClient = useQueryClient();
  // const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: (response: AuthResponse) => {
      // Store user data in cache
      queryClient.setQueryData(authKeys.user(), response.user);
      // Clear previous user's data
      clearUserSpecificData(queryClient);
    },
  });
}

// Hook to login user
export function useLogin() {
  const queryClient = useQueryClient();
  // const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (response: AuthResponse) => {
      // Store user data in cache
      queryClient.setQueryData(authKeys.user(), response.user);
      // Clear any previous user's data from cache
      clearUserSpecificData(queryClient);
    },
  });
}

// Hook to logout user
export function useLogout() {
  const { dispatch } = useApp();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      // Clear all user-specific data from cache
      clearAllUserData(queryClient);

      if (socket) {
        console.log("🔌 Disconnecting socket on logout");
        socket.disconnect();
      }

      // Clear local state
      dispatch({ type: "LOGOUT" });

      // Redirect to login page
      navigate("/login", { replace: true });
    },
    onError: (error) => {
      console.error("Logout error:", error);
      // Even if logout fails on server, clear local state
      clearAllUserData(queryClient);
      if (socket) {
        socket.disconnect();
      }
      dispatch({ type: "LOGOUT" });
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
    // Don't cache for too long to ensure fresh data
    staleTime: 5 * 60 * 1000, // 5 minutes
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
