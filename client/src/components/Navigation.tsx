import { Link, useLocation } from "react-router-dom";
import { useApp } from "../contexts/AppContext";
import { useTheme } from "../contexts/ThemeContext";
import { ThemeToggle } from "./ThemeToggle";
import { LogoutButton } from "./LogoutButton";
import { useState } from "react";

export function Navigation() {
  const { state } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const { isDark } = useTheme();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  if (!state.isAuthenticated) {
    return null;
  }

  return (
    <nav
      className={`border-b ${
        isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link
              to="/profile"
              className={`text-lg font-semibold ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              Neon Chat
            </Link>

            <div className="hidden md:flex space-x-4">
              {" "}
              {/* Desktop navigation links */}
              <Link
                to="/profile"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive("/profile")
                    ? isDark
                      ? "bg-gray-700 text-white"
                      : "bg-gray-100 text-gray-900"
                    : isDark
                    ? "text-gray-300 hover:text-white hover:bg-gray-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                Profile
              </Link>
              <Link
                to="/chat"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive("/chat")
                    ? isDark
                      ? "bg-gray-700 text-white"
                      : "bg-gray-100 text-gray-900"
                    : isDark
                    ? "text-gray-300 hover:text-white hover:bg-gray-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                Chat
              </Link>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {" "}
            {/* Desktop right section */}
            <div
              className={`text-sm ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Welcome, {state.user?.name}
            </div>
            <ThemeToggle />
            <LogoutButton />
          </div>

          <div className="md:hidden flex items-center">
            {" "}
            {/* Mobile menu button */}
            <button
              onClick={handleToggle}
              type="button"
              className={`inline-flex items-center justify-center p-2 rounded-md ${
                isDark
                  ? "text-gray-400 hover:text-white hover:bg-gray-700"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              } focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--accent-500)]`}
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {/* Icon when menu is closed. */}
              {/* Heroicon name: outline/menu */}
              {!isOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state. */}
      {isOpen && (
        <div>
          <div
            className={`md:hidden ${isDark ? "bg-gray-800" : "bg-white"}`}
            id="mobile-menu"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link
                to="/profile"
                onClick={handleToggle}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive("/profile")
                    ? isDark
                      ? "bg-gray-700 text-white"
                      : "bg-gray-100 text-gray-900"
                    : isDark
                    ? "text-gray-300 hover:text-white hover:bg-gray-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                Profile
              </Link>
              <Link
                to="/chat"
                onClick={handleToggle}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive("/chat")
                    ? isDark
                      ? "bg-gray-700 text-white"
                      : "bg-gray-100 text-gray-900"
                    : isDark
                    ? "text-gray-300 hover:text-white hover:bg-gray-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                Chat
              </Link>
              <div className="flex items-center justify-between px-3 py-2">
                <div
                  className={`text-sm ${
                    isDark ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Welcome, {state.user?.name}
                </div>
                <ThemeToggle />
                <LogoutButton isNav={true} />
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
