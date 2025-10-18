import { Navigate, useLocation } from "react-router-dom";
import { useApp } from "../contexts/appcontext/index";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { state } = useApp();
  const location = useLocation();

  if (state.loading) {
    return null;
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
