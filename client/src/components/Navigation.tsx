import { Link, useLocation } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'
import { useTheme } from '../contexts/ThemeContext'
import { ThemeToggle } from './ThemeToggle'
import { LogoutButton } from './LogoutButton'

export function Navigation() {
  const { state } = useApp()
  const { isDark } = useTheme()
  const location = useLocation()

  const isActive = (path: string) => {
    return location.pathname === path
  }

  if (!state.isAuthenticated) {
    return null
  }

  return (
    <nav className={`border-b ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link
              to="/profile"
              className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}
            >
              Neon Chat
            </Link>
            
            <div className="flex space-x-4">
              <Link
                to="/profile"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/profile')
                    ? isDark
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-100 text-gray-900'
                    : isDark
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Profile
              </Link>
              <Link
                to="/chat"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/chat')
                    ? isDark
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-100 text-gray-900'
                    : isDark
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Chat
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Welcome, {state.user?.name}
            </div>
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </div>
    </nav>
  )
} 