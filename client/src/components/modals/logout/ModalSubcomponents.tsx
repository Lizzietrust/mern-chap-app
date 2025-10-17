import React from "react";
import { modalStyles } from "../../../styles/modalstyles";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "sm",
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div
      className={`animate-spin rounded-full border-b-2 border-white ${sizeClasses[size]}`}
    />
  );
};

interface ModalHeaderProps {
  isDark: boolean;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({ isDark }) => (
  <>
    <h3 className={modalStyles.text.title(isDark)}>Confirm Logout</h3>
    <p className={modalStyles.text.subtitle(isDark)}>
      Are you sure you want to logout? Your online status will be updated for
      other users.
    </p>
  </>
);

interface ModalActionsProps {
  isDark: boolean;
  isLoading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ModalActions: React.FC<ModalActionsProps> = ({
  isDark,
  isLoading,
  onCancel,
  onConfirm,
}) => (
  <div className="flex justify-end space-x-3">
    <button
      onClick={onCancel}
      disabled={isLoading}
      className={modalStyles.buttons.cancel(isDark, isLoading)}
    >
      Cancel
    </button>
    <button
      onClick={onConfirm}
      disabled={isLoading}
      className={modalStyles.buttons.confirm(isLoading)}
    >
      {isLoading ? (
        <div className="flex items-center">
          <LoadingSpinner size="sm" />
          <span className="ml-2">Logging out...</span>
        </div>
      ) : (
        "Logout"
      )}
    </button>
  </div>
);
