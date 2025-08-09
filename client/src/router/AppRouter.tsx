import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from '../pages/auth/LoginPage'
import { RegisterPage } from '../pages/auth/RegisterPage'
import { ProfilePage } from '../pages/ProfilePage'
import { ProfileSetupPage } from '../pages/ProfileSetupPage'
import { ChatPage } from '../pages/ChatPage'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { useApp } from '../contexts/AppContext'

export function AppRouter() {
  const { state } = useApp()

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={
            state.isAuthenticated ? (
              <Navigate to="/profile" replace />
            ) : (
              <LoginPage />
            )
          } 
        />
        <Route 
          path="/register" 
          element={
            state.isAuthenticated ? (
              <Navigate to="/profile" replace />
            ) : (
              <RegisterPage />
            )
          } 
        />

        {/* Protected routes */}
        <Route
          path="/profile-setup"
          element={
            <ProtectedRoute>
              <ProfileSetupPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />

        {/* Default redirects */}
        <Route
          path="/"
          element={
            state.isAuthenticated ? (
              <Navigate to="/profile" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Catch all route */}
        <Route
          path="*"
          element={
            state.isAuthenticated ? (
              <Navigate to="/profile" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  )
} 