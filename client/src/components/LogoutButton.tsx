import { useState } from "react";
import { useLogout } from "../hooks/auth";
import LogoutModal from "./modals/logout/LogoutModal";

interface LogoutButtonProps {
  isNav?: boolean;
}

export function LogoutButton({ isNav = false }: LogoutButtonProps) {
  const logoutMutation = useLogout({
    onSuccess: () => {
      setShowModal(false);
    },
  });
  const [showModal, setShowModal] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
    setShowModal(false);
  };

  const openModal = () => setShowModal(true);

  return (
    <>
      <button
        onClick={openModal}
        disabled={logoutMutation.isPending}
        className={`relative px-4 py-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${
          isNav
            ? "text-sm font-medium text-white bg-red-600 hover:bg-red-700"
            : "font-regular text-red-600 hover:bg-red-50 border border-red-200"
        }`}
      >
        {/* Loading spinner */}
        {logoutMutation.isPending && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
          </div>
        )}

        {/* Button text with opacity control for loading state */}
        <span
          className={
            logoutMutation.isPending
              ? "opacity-0"
              : "opacity-100 transition-opacity"
          }
        >
          Logout
        </span>
      </button>

      <LogoutModal
        showModal={showModal}
        setShowModal={setShowModal}
        onConfirm={handleLogout}
        isLoading={logoutMutation.isPending}
      />
    </>
  );
}
