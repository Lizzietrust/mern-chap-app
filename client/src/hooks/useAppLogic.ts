import { useEffect } from "react";
import { authApi } from "../lib/api";
import { useMe } from "./useAuth";
import { useSelectedChat } from "../contexts/selectedChatContext";
import type {
  User,
  AppNotification,
  AppState,
  AppAction,
  ApiUser,
} from "../types/app";

interface UseAppLogicProps {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

// interface AuthResponse {
//   user: ApiUser;
// }

export function useAppLogic({ state, dispatch }: UseAppLogicProps) {
  const { clearSelectedChat } = useSelectedChat();
  const meQuery = useMe(true);

  useEffect(() => {
    dispatch({ type: "SET_LOADING", payload: meQuery.isFetching });
  }, [meQuery.isFetching, dispatch]);

  useEffect(() => {
    if (meQuery.data?.user) {
      const userData = transformUserResponse(meQuery.data.user);
      dispatch({ type: "SET_USER", payload: userData });
    }
  }, [meQuery.data, dispatch]);

  useEffect(() => {
    if (meQuery.isError) {
      dispatch({ type: "SET_USER", payload: null });
    }
  }, [meQuery.isError, dispatch]);

  const login = (user: User) => {
    dispatch({ type: "SET_USER", payload: user });
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      dispatch({ type: "LOGOUT" });
      clearSelectedChat();
    }
  };

  const toggleTheme = () => {
    const newTheme = state.theme === "light" ? "dark" : "light";
    dispatch({ type: "SET_THEME", payload: newTheme });
  };

  const toggleSidebar = () => {
    dispatch({ type: "TOGGLE_SIDEBAR" });
  };

  const addNotification = (notification: Omit<AppNotification, "id">) => {
    const id = generateId();
    const newNotification = { ...notification, id };

    dispatch({ type: "ADD_NOTIFICATION", payload: newNotification });

    if (!notification.duration || notification.duration > 0) {
      const duration = notification.duration || 5000;
      setTimeout(() => {
        dispatch({ type: "REMOVE_NOTIFICATION", payload: id });
      }, duration);
    }
  };

  const removeNotification = (id: string) => {
    dispatch({ type: "REMOVE_NOTIFICATION", payload: id });
  };

  const setLoading = (loading: boolean) => {
    dispatch({ type: "SET_LOADING", payload: loading });
  };

  return {
    login,
    logout,
    toggleTheme,
    toggleSidebar,
    addNotification,
    removeNotification,
    setLoading,
  };
}

function transformUserResponse(userData: ApiUser): User {
  const name =
    userData.firstName && userData.lastName
      ? `${userData.firstName} ${userData.lastName}`
      : userData.email.split("@")[0];

  return {
    ...userData,
    name,
    avatar: userData.image,
  };
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}
