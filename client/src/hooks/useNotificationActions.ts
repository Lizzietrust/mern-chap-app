import { useNotifications } from "./useNotification";

export function useNotificationActions() {
  const { success, error, warning, info, removeNotification, clearAll } =
    useNotifications();

  const showSuccess = (message: string, title?: string) => {
    return success(message, title);
  };

  const showError = (message: string, title?: string) => {
    return error(message, title);
  };

  const showWarning = (message: string, title?: string) => {
    return warning(message, title);
  };

  const showInfo = (message: string, title?: string) => {
    return info(message, title);
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeNotification,
    clearAll,
  };
}
