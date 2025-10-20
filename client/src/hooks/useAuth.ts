import {
  useLogin,
  useRegister,
  useLogout,
  useUpdateProfile,
  useMe,
} from "./useAuthLogic";
import type {
  AuthHooks,
  // UseLogoutOptions,
  // UpdateProfileData,
} from "../types/auth";
import { useCallback, useMemo } from "react";

export function useAuth(): AuthHooks {
  const register = useRegister();
  const login = useLogin();
  const logout = useLogout();
  const updateProfile = useUpdateProfile();
  const meQuery = useMe();

  const authState = useMemo(
    () => ({
      user: meQuery.data || null,
      isLoading: meQuery.isLoading,
      isAuthenticated: !!meQuery.data,
      error:
        meQuery.error || register.error || login.error || updateProfile.error,
    }),
    [
      meQuery.data,
      meQuery.isLoading,
      meQuery.error,
      register.error,
      login.error,
      updateProfile.error,
    ]
  );

  return {
    register,
    login,
    logout,
    updateProfile,
    meQuery,
    ...authState,
  };
}

export function useAuthState() {
  const { user, isLoading, isAuthenticated, error } = useAuth();
  return { user, isLoading, isAuthenticated, error };
}

export function useAuthActions() {
  const { login, register, logout, updateProfile } = useAuth();
  return { login, register, logout, updateProfile };
}

export function useCurrentUser() {
  const { user } = useAuth();
  return user;
}

export function useAuthGuard() {
  const { isAuthenticated, isLoading } = useAuth();

  return {
    isAuthenticated,
    isLoading,
    requireAuth: useCallback(
      (callback: () => void) => {
        if (isAuthenticated && !isLoading) {
          callback();
        }
      },
      [isAuthenticated, isLoading]
    ),
  };
}

export function usePermission(permission?: string) {
  const { user } = useAuth();

  return useMemo(() => {
    if (!permission) return true;
    if (!user?.permissions) return false;

    return user.permissions.includes(permission);
  }, [user, permission]);
}
