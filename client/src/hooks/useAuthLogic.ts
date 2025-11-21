import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { authApi } from "../lib/api";
import { useApp } from "../contexts/appcontext/index";
import { useSocket } from "./useSocket";
import { useNotifications } from "../contexts";
import { useCacheManager } from "../utils/cacheManager";
import { AUTH_KEYS, STALE_TIMES, RETRY_CONFIG } from "../constants/auth";
import type {
  UseLogoutOptions,
  UpdateProfileData,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
} from "../types/auth";
import type { AppAction } from "../types/app";

export function useAuthBase() {
  const cacheManager = useCacheManager();
  const notifications = useNotifications();

  const showSuccess = notifications.success;
  const showError = notifications.error;

  return { cacheManager, showSuccess, showError };
}

export function useLogin() {
  const { cacheManager, showSuccess, showError } = useAuthBase();

  return useMutation<AuthResponse, Error, LoginRequest>({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (response: AuthResponse) => {
      cacheManager.updateUserData(response.user);
      cacheManager.clearUserSpecificData();
      showSuccess("Login successful!");
    },
    onError: (error: Error) => {
      showError("Login failed. Please try again.");
      console.error("Login error:", error);
    },
  });
}

export function useRegister() {
  const { cacheManager, showSuccess, showError } = useAuthBase();

  return useMutation<AuthResponse, Error, RegisterRequest>({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: (response: AuthResponse) => {
      cacheManager.updateUserData(response.user);
      cacheManager.clearUserSpecificData();
      showSuccess("Registration successful!");
    },
    onError: (error: Error) => {
      showError("Registration failed. Please try again.");
      console.error("Registration error:", error);
    },
  });
}

export function useLogout(options: UseLogoutOptions = {}) {
  const { dispatch } = useApp();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const { cacheManager, showSuccess, showError } = useAuthBase();

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      if (socket) {
        socket.emit("user_status", { isOnline: false });
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      return authApi.logout();
    },
    onSuccess: () => {
      handleLogoutSuccess({
        cacheManager,
        socket,
        dispatch,
        showSuccess,
        showError,
        navigate,
        options,
      });
    },
    onError: (error: Error) => {
      handleLogoutError({
        error,
        cacheManager,
        socket,
        dispatch,
        showError,
        navigate,
        options,
      });
    },
  });
}

export function useMe(enabled: boolean = true) {
  return useQuery<User, Error>({
    queryKey: AUTH_KEYS.USER(),
    queryFn: authApi.me,
    enabled,
    staleTime: STALE_TIMES.USER_DATA,
    retry: (failureCount, error: unknown) => {
      if (
        error &&
        typeof error === "object" &&
        "status" in error &&
        error.status === 401
      ) {
        return false;
      }
      return failureCount < RETRY_CONFIG.MAX_RETRIES;
    },
  });
}

export function useUpdateProfile() {
  const { cacheManager, showSuccess, showError } = useAuthBase();
  const queryClient = useQueryClient();

  return useMutation<AuthResponse, Error, UpdateProfileData>({
    mutationFn: (data: UpdateProfileData) => authApi.updateProfile(data),
    onSuccess: (response: AuthResponse) => {
      cacheManager.updateUserData(response.user);
      showSuccess("Profile updated successfully!");

      queryClient.invalidateQueries({ queryKey: AUTH_KEYS.USER() });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });

      queryClient.setQueryData(
        ["userProfile", response.user._id],
        response.user
      );
    },
    onError: (error: Error) => {
      showError("Failed to update profile");
      console.error("Update profile error:", error);
    },
  });
}

interface LogoutHandlers {
  cacheManager: ReturnType<typeof useCacheManager>;
  socket: ReturnType<typeof useSocket>["socket"];
  dispatch: React.Dispatch<AppAction>;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  navigate: (path: string, options?: { replace?: boolean }) => void;
  options: UseLogoutOptions;
}

function handleLogoutSuccess({
  cacheManager,
  socket,
  dispatch,
  showSuccess,
  //   showError,
  navigate,
  options,
}: LogoutHandlers) {
  cacheManager.clearAllUserData();

  if (socket) {
    console.log("🔌 Disconnecting socket on logout");
    socket.disconnect();
  }

  dispatch({ type: "LOGOUT" });
  showSuccess("Logged out successfully");
  navigate("/login", { replace: true });
  options.onSuccess?.();
}

function handleLogoutError({
  error,
  cacheManager,
  socket,
  dispatch,
  showError,
  navigate,
  options,
}: Omit<LogoutHandlers, "showSuccess"> & { error: Error }) {
  console.error("Logout error:", error);

  cacheManager.clearAllUserData();

  if (socket) {
    socket.disconnect();
  }

  dispatch({ type: "LOGOUT" });
  showError("Logout completed locally");
  navigate("/login", { replace: true });
  options.onError?.(error);
}
