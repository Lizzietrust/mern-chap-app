import { useReducer, useCallback, useRef } from "react";
import type {
  NotificationContextType,
  Notification,
} from "../types/notification";
import {
  notificationReducer,
  initialState,
} from "../contexts/reducers/notificationReducer";

export function useNotificationLogic(): NotificationContextType {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const timeoutsRef = useRef<Map<string, number>>(new Map());

  const addNotification = useCallback(
    (notification: Omit<Notification, "id">): string => {
      const id = generateId();
      const newNotification = { ...notification, id };

      dispatch({ type: "ADD_NOTIFICATION", payload: newNotification });

      if (!notification.persistent) {
        const duration = notification.duration || 5000;

        const existingTimeout = timeoutsRef.current.get(id);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        const timeoutId = window.setTimeout(() => {
          dispatch({ type: "REMOVE_NOTIFICATION", payload: id });
          timeoutsRef.current.delete(id);
        }, duration);

        timeoutsRef.current.set(id, timeoutId);
      }

      return id;
    },
    []
  );

  const removeNotification = useCallback((id: string) => {
    const timeoutId = timeoutsRef.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutsRef.current.delete(id);
    }

    dispatch({ type: "REMOVE_NOTIFICATION", payload: id });
  }, []);

  const clearAll = useCallback(() => {
    timeoutsRef.current.forEach((timeout) => {
      clearTimeout(timeout);
    });
    timeoutsRef.current.clear();

    dispatch({ type: "CLEAR_ALL" });
  }, []);

  const success = useCallback(
    (message: string, title?: string) => {
      return addNotification({ type: "success", message, title });
    },
    [addNotification]
  );

  const error = useCallback(
    (message: string, title?: string) => {
      return addNotification({ type: "error", message, title, duration: 7000 });
    },
    [addNotification]
  );

  const warning = useCallback(
    (message: string, title?: string) => {
      return addNotification({ type: "warning", message, title });
    },
    [addNotification]
  );

  const info = useCallback(
    (message: string, title?: string) => {
      return addNotification({ type: "info", message, title });
    },
    [addNotification]
  );

  return {
    notifications: state.notifications,
    addNotification,
    removeNotification,
    clearAll,
    success,
    error,
    warning,
    info,
  };
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}
