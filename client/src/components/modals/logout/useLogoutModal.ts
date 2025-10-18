import { useCallback } from "react";
import { useTheme } from "../../../contexts/theme";
import { useApp } from "../../../contexts/appcontext/index";
import { useNotifications } from "../../../contexts";

export const useLogoutModal = (
  onConfirm: () => void,
  setShowModal: (show: boolean) => void,
  isLoading: boolean
) => {
  const { isDark } = useTheme();
  const { logout: logoutFromContext } = useApp();
  const { success } = useNotifications();

  const handleConfirmLogout = useCallback(() => {
    if (isLoading) return;

    onConfirm();
    logoutFromContext();
    success("Successfully logged out!", "See you soon");
    setShowModal(false);
  }, [onConfirm, logoutFromContext, success, setShowModal, isLoading]);

  const closeModal = useCallback(() => {
    if (!isLoading) {
      setShowModal(false);
    }
  }, [setShowModal, isLoading]);

  return {
    isDark,
    handleConfirmLogout,
    closeModal,
    isLoading,
  };
};
