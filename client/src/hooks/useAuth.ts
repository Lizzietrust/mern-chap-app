import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { authApi, type RegisterRequest, type LoginRequest } from "../lib/api";
import type { AuthResponse } from "../types/types";
import { useApp } from "../contexts/appcontext/index";
import { useSocket } from "../contexts/useSocket";
import { useNotifications } from "../contexts"; // Use your existing context

// Query keys for auth
export const authKeys = {
  all: ["auth"] as const,
  user: () => [...authKeys.all, "user"] as const,
};

// Cache management utilities
export const authCache = {
  clearUserSpecificData(queryClient: ReturnType<typeof useQueryClient>) {
    const userSpecificQueries = [
      ["chats"],
      ["messages"],
      ["userChats"],
      ["notifications"],
      ["settings"],
      ["socket"],
    ];

    userSpecificQueries.forEach((queryKey) => {
      queryClient.removeQueries({ queryKey });
    });

    // Invalidate users list (optional - depends on your app)
    queryClient.invalidateQueries({ queryKey: ["users"] });
  },

  clearAllUserData(queryClient: ReturnType<typeof useQueryClient>) {
    // Clear auth data
    queryClient.removeQueries({ queryKey: authKeys.user() });

    // Clear user-specific data
    this.clearUserSpecificData(queryClient);
  },
};

interface UseLogoutOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

// Enhanced logout hook with notifications
export function useLogout(options: UseLogoutOptions = {}) {
  const { dispatch } = useApp();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { success: showSuccess, error: showError } = useNotifications(); // Use your notification methods

  return useMutation({
    mutationFn: async () => {
      // Update user status to offline before logout
      if (socket) {
        socket.emit("user_status", { isOnline: false });
        await new Promise((resolve) => setTimeout(resolve, 300)); // Small delay
      }

      return authApi.logout();
    },
    onSuccess: () => {
      // Clear all user data from cache
      authCache.clearAllUserData(queryClient);

      // Disconnect socket
      if (socket) {
        console.log("🔌 Disconnecting socket on logout");
        socket.disconnect();
      }

      // Clear local state
      dispatch({ type: "LOGOUT" });

      // Show success feedback using your notification system
      showSuccess("Logged out successfully");

      // Redirect to login
      navigate("/login", { replace: true });

      options.onSuccess?.();
    },
    onError: (error: Error) => {
      console.error("Logout error:", error);

      // Fallback: Clear local data even if server logout fails
      authCache.clearAllUserData(queryClient);

      if (socket) {
        socket.disconnect();
      }

      dispatch({ type: "LOGOUT" });

      // Show error feedback
      showError("Logout completed locally");

      // Still redirect to login (fail-safe)
      navigate("/login", { replace: true });

      options.onError?.(error);
    },
  });
}

// Enhanced login hook with notifications
export function useLogin() {
  const queryClient = useQueryClient();
  const { success: showSuccess, error: showError } = useNotifications();

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (response: AuthResponse) => {
      // Store user data in cache
      queryClient.setQueryData(authKeys.user(), response.user);

      // Clear any previous user's data from cache
      authCache.clearUserSpecificData(queryClient);

      // Show success notification
      showSuccess("Login successful!");
    },
    onError: (error: Error) => {
      // Show error notification
      showError("Login failed. Please try again.");
      console.error("Login error:", error);
    },
  });
}

// Enhanced register hook with notifications
export function useRegister() {
  const queryClient = useQueryClient();
  const { success: showSuccess, error: showError } = useNotifications();

  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: (response: AuthResponse) => {
      queryClient.setQueryData(authKeys.user(), response.user);
      authCache.clearUserSpecificData(queryClient);
      showSuccess("Registration successful!");
    },
    onError: (error: Error) => {
      showError("Registration failed. Please try again.");
      console.error("Registration error:", error);
    },
  });
}

// Enhanced me hook with retry logic
export function useMe(enabled: boolean = true) {
  return useQuery({
    queryKey: authKeys.user(),
    queryFn: authApi.me,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 401 (unauthorized)
      if (error?.status === 401) return false;
      return failureCount < 3;
    },
  });
}

// Enhanced update profile hook with notifications
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { success: showSuccess, error: showError } = useNotifications();

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
      queryClient.setQueryData(authKeys.user(), response.user);
      showSuccess("Profile updated successfully!");
    },
    onError: (error: Error) => {
      showError("Failed to update profile");
      console.error("Update profile error:", error);
    },
  });
}

// Optional: Export a hook that provides all auth operations
export function useAuth() {
  const register = useRegister();
  const login = useLogin();
  const logout = useLogout();
  const updateProfile = useUpdateProfile();
  const meQuery = useMe();

  return {
    register,
    login,
    logout,
    updateProfile,
    meQuery,
    user: meQuery.data,
    isLoading: meQuery.isLoading,
    isAuthenticated: !!meQuery.data,
  };
}
