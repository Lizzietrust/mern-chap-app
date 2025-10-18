import { useApp } from "../contexts/appcontext/index"; 

export function useAppNotifications() {
  const { addNotification, removeNotification } = useApp();

  const showSuccess = (message: string, duration?: number) => {
    addNotification({ type: "success", message, duration });
  };

  const showError = (message: string, duration?: number) => {
    addNotification({ type: "error", message, duration: duration || 7000 });
  };

  const showWarning = (message: string, duration?: number) => {
    addNotification({ type: "warning", message, duration });
  };

  const showInfo = (message: string, duration?: number) => {
    addNotification({ type: "info", message, duration });
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeNotification,
  };
}

export function useAppUI() {
  const { state, toggleTheme, toggleSidebar, setLoading } = useApp();

  return {
    theme: state.theme,
    sidebarOpen: state.sidebarOpen,
    loading: state.loading,
    toggleTheme,
    toggleSidebar,
    setLoading,
  };
}

export function useAppAuth() {
  const { state, login, logout } = useApp();

  return {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    login,
    logout,
  };
}
