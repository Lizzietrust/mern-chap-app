import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from '../pages/auth/LoginPage'
import { RegisterPage } from '../pages/auth/RegisterPage'
import { ProfilePage } from '../pages/ProfilePage'
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
            state.loading ? null : state.isAuthenticated ? (
              <Navigate to="/profile" replace />
            ) : (
              <LoginPage />
            )
          } 
        />
        <Route 
          path="/register" 
          element={
            state.loading ? null : state.isAuthenticated ? (
              <Navigate to="/profile" replace />
            ) : (
              <RegisterPage />
            )
          } 
        />

        {/* Protected routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/:chatId?"
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
            state.loading ? null : state.isAuthenticated ? (
              <Navigate to="/chat" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Catch all route */}
        <Route
          path="*"
          element={
            state.loading ? null : state.isAuthenticated ? (
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