import { Navigate, useLocation } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { state } = useApp()
  const location = useLocation()

  // While we are bootstrapping auth from cookie, avoid premature redirects
  if (state.loading) {
    return null
  }

  if (!state.isAuthenticated) {
    // Redirect to login page with the current location as the return path
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If user exists but hasn't completed profile setup, always send them to profile page
  if (state.user && !state.user.profileSetup && location.pathname !== '/profile') {
    return <Navigate to="/profile" replace />
  }

  return <>{children}</>
} 