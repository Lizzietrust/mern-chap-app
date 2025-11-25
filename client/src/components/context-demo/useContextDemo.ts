import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { User as TypesUser, NotificationDemo } from "../../types/types";
import type { User as AppUser } from "../../types/app";
import { useApp } from "../../contexts/appcontext/index";
import { useTheme } from "../../hooks/useTheme";
import { useNotifications } from "../../contexts";

const convertToAppUser = (user: TypesUser): AppUser => {
  return {
    ...user,
    lastSeen:
      user.lastSeen instanceof Date
        ? user.lastSeen
        : typeof user.lastSeen === "string"
        ? new Date(user.lastSeen)
        : undefined,
  };
};

export const useContextDemo = () => {
  const { state, login, logout, toggleSidebar, setLoading } = useApp();
  const { theme, isDark } = useTheme();
  const { success, error, warning, info, addNotification } = useNotifications();
  const queryClient = useQueryClient();

  const [demoUser] = useState<TypesUser>({
    _id: "demo-user-1",
    name: "Demo User",
    email: "demo@example.com",
    profileSetup: true,
    avatar: "",
    isOnline: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastSeen: new Date(),
  });

  const handleLogin = useCallback(() => {
    const loginUser: AppUser = convertToAppUser(demoUser);
    login(loginUser);
    success("Successfully logged in!", "Welcome back");
  }, [login, demoUser, success]);

  const handleLogout = useCallback(() => {
    logout();
    queryClient.clear();
    info("You have been logged out");
  }, [logout, queryClient, info]);

  const handleTestNotifications = useCallback(() => {
    const notifications: NotificationDemo[] = [
      {
        type: "success",
        title: "Success",
        message: "This is a success message!",
        delay: 0,
      },
      {
        type: "error",
        title: "Error",
        message: "This is an error message!",
        delay: 1000,
      },
      {
        type: "warning",
        title: "Warning",
        message: "This is a warning message!",
        delay: 2000,
      },
      {
        type: "info",
        title: "Info",
        message: "This is an info message!",
        delay: 3000,
      },
      {
        type: "success",
        title: "Action Required",
        message:
          "This notification has an action button. Click it to see what happens!",
        delay: 4000,
        duration: 8000,
        action: {
          label: "Take Action",
          onClick: () => success("Action completed!", "Great job!"),
        },
      },
      {
        type: "warning",
        title: "Important Notice",
        message:
          "This is a persistent notification that won't auto-dismiss. You must close it manually.",
        delay: 5000,
        persistent: true,
      },
      {
        type: "info",
        title: "Detailed Information",
        message:
          "This is a longer notification message that demonstrates how the improved toast handles multi-line content and longer text. The notification will automatically adjust its height and maintain proper spacing.",
        delay: 6000,
        duration: 10000,
      },
    ];

    notifications.forEach(
      ({ type, title, message, delay = 0, duration, persistent, action }) => {
        setTimeout(() => {
          if (action || persistent || duration) {
            addNotification({
              type,
              title,
              message,
              duration,
              persistent,
              action,
            });
          } else {
            switch (type) {
              case "success":
                success(message, title);
                break;
              case "error":
                error(message, title);
                break;
              case "warning":
                warning(message, title);
                break;
              case "info":
                info(message, title);
                break;
            }
          }
        }, delay);
      }
    );
  }, [success, error, warning, info, addNotification]);

  const toggleLoading = useCallback(() => {
    setLoading(!state.loading);
  }, [setLoading, state.loading]);

  return {
    state,
    theme,
    isDark,
    demoUser,
    handleLogin,
    handleLogout,
    handleTestNotifications,
    toggleLoading,
    toggleSidebar,
  };
};
