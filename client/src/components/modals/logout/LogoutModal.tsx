import React from "react";
import type { LogoutModalProps } from "../../../types/types";
import { useLogoutModal } from "./useLogoutModal";
import { modalStyles } from "../../../styles/modalstyles";
import { ModalHeader, ModalActions } from "./ModalSubcomponents";

const LogoutModal: React.FC<LogoutModalProps> = ({
  showModal,
  setShowModal,
  onConfirm,
  isLoading,
}) => {
  const { isDark, handleConfirmLogout, closeModal } = useLogoutModal(
    onConfirm,
    setShowModal,
    isLoading
  );

  if (!showModal) return null;

  return (
    <div
      className={modalStyles.overlay}
      onClick={closeModal}
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-modal-title"
    >
      <div
        className={modalStyles.container(isDark)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <ModalHeader isDark={isDark} />
          <ModalActions
            isDark={isDark}
            isLoading={isLoading}
            onCancel={closeModal}
            onConfirm={handleConfirmLogout}
          />
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;
