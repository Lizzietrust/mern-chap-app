import { Navigate, useLocation } from "react-router-dom";
import { useApp } from "../contexts/appcontext/index";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { state } = useApp();
  const location = useLocation();

  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!state.isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (
    state.user &&
    !state.user.profileSetup &&
    location.pathname !== "/profile"
  ) {
    return <Navigate to="/profile" replace />;
  }

  return <>{children}</>;
}
