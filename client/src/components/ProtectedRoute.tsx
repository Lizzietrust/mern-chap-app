import { Navigate, useLocation } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { state } = useApp()
  const location = useLocation()

  if (!state.isAuthenticated) {
    // Redirect to login page with the current location as the return path
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
} 