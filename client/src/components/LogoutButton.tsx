import { useLogout } from "../hooks/useAuth";
import { useApp } from "../contexts/AppContext";
import { useNotifications } from "../contexts/NotificationContext";

export function LogoutButton() {
  const { logout: logoutFromContext } = useApp();
  const { success } = useNotifications();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        logoutFromContext();
        success("Successfully logged out!", "See you soon");
      },
      onError: (error) => {
        console.error("Logout error:", error);
        // Still clear local state even if server logout fails
        logoutFromContext();
        success("Logged out successfully!", "See you soon");
      },
    });
  };

  return (
    <button
      onClick={handleLogout}
      disabled={logoutMutation.isPending}
      className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded-md  cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {logoutMutation.isPending ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Logging out...
        </div>
      ) : (
        "Logout"
      )}
    </button>
  );
} 