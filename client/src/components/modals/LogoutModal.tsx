import { useTheme } from "../../contexts/ThemeContext";
import { useApp } from "../../contexts/AppContext";
import { useNotifications } from "../../contexts/NotificationContext";

interface LogoutModalProps {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  onConfirm: () => void;
  isLoading: boolean;
}

const LogoutModal: React.FC<LogoutModalProps> = ({
  showModal,
  setShowModal,
  onConfirm,
  isLoading,
}) => {
  const closeModal = () => setShowModal(false);

  const { isDark } = useTheme();
  const { logout: logoutFromContext } = useApp();
  const { success } = useNotifications();

  const handleConfirmLogout = () => {
    // Call the onConfirm function passed from LogoutButton
    onConfirm();

    // Also update the app context and show success message
    logoutFromContext();
    success("Successfully logged out!", "See you soon");
    setShowModal(false);
  };

  const modalBgClass = isDark ? "bg-gray-800" : "bg-white";
  const modalTextClass = isDark ? "text-white" : "text-gray-900";
  const modalSubtextClass = isDark ? "text-gray-300" : "text-gray-600";
  const cancelButtonClass = isDark
    ? "bg-gray-700 text-gray-200 hover:bg-gray-600 focus:ring-gray-500"
    : "bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500";

  return (
    <div
      className="fixed inset-0 bg-white/50 bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={closeModal}
    >
      <div
        className={`${modalBgClass} rounded-lg shadow-xl max-w-md w-full`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h3 className={`text-lg font-semibold ${modalTextClass} mb-2`}>
            Confirm Logout
          </h3>
          <p className={`${modalSubtextClass} mb-6`}>
            Are you sure you want to logout? Your online status will be updated
            for other users.
          </p>

          <div className="flex justify-end space-x-3">
            <button
              onClick={closeModal}
              disabled={isLoading}
              className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${cancelButtonClass}`}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmLogout}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Logging out...
                </div>
              ) : (
                "Logout"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;
