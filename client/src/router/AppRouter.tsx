import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { ProfilePage } from "../pages/ProfilePage";
import { ChatPage } from "../pages/ChatPage";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { useApp } from "../contexts/appcontext/index";

export function AppRouter() {
  const { state } = useApp();

  const RouteLoading = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  );

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            state.loading ? (
              <RouteLoading />
            ) : state.isAuthenticated ? (
              <Navigate to="/profile" replace />
            ) : (
              <LoginPage />
            )
          }
        />
        <Route
          path="/register"
          element={
            state.loading ? (
              <RouteLoading />
            ) : state.isAuthenticated ? (
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
            state.loading ? (
              <RouteLoading />
            ) : state.isAuthenticated ? (
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
            state.loading ? (
              <RouteLoading />
            ) : state.isAuthenticated ? (
              <Navigate to="/profile" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
