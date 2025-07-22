import { useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { useTheme } from '../contexts/ThemeContext'
import { useNotifications } from '../contexts/NotificationContext'
import { ThemeToggle } from './ThemeToggle'
import { UserList } from './UserList'

export function ContextDemo() {
  const { state, login, logout, toggleSidebar, setLoading } = useApp()
  const { theme, isDark } = useTheme()
  const { success, error, warning, info } = useNotifications()
  
  const [demoUser] = useState({
    id: 1,
    name: 'Demo User',
    email: 'demo@example.com'
  })

  const handleLogin = () => {
    login(demoUser)
    success('Successfully logged in!', 'Welcome back')
  }

  const handleLogout = () => {
    logout()
    info('You have been logged out')
  }

  const handleTestNotifications = () => {
    success('This is a success message!', 'Success')
    setTimeout(() => error('This is an error message!', 'Error'), 1000)
    setTimeout(() => warning('This is a warning message!', 'Warning'), 2000)
    setTimeout(() => info('This is an info message!', 'Info'), 3000)
  }

  return (
    <div className={`min-h-screen transition-colors ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      {/* Header */}
      <header className={`border-b ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold">Context State Management Demo</h1>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <button
                onClick={toggleSidebar}
                className={`px-4 py-2 rounded-md ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                Toggle Sidebar
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* State Display */}
        <div className={`mb-8 p-6 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
          <h2 className="text-xl font-semibold mb-4">Current App State</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className={`p-4 rounded-md ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h3 className="font-medium mb-2">Authentication</h3>
              <p>Status: {state.isAuthenticated ? 'Logged In' : 'Not Logged In'}</p>
              {state.user && (
                <p>User: {state.user.name}</p>
              )}
            </div>
            <div className={`p-4 rounded-md ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h3 className="font-medium mb-2">Theme</h3>
              <p>Current: {theme}</p>
              <p>Mode: {isDark ? 'Dark' : 'Light'}</p>
            </div>
            <div className={`p-4 rounded-md ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h3 className="font-medium mb-2">UI State</h3>
              <p>Sidebar: {state.sidebarOpen ? 'Open' : 'Closed'}</p>
              <p>Loading: {state.loading ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={`mb-8 p-6 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="flex flex-wrap gap-4">
            {!state.isAuthenticated ? (
              <button
                onClick={handleLogin}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
              >
                Login
              </button>
            ) : (
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            )}
            
            <button
              onClick={handleTestNotifications}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Test Notifications
            </button>
            
            <button
              onClick={() => setLoading(!state.loading)}
              className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
            >
              Toggle Loading
            </button>
          </div>
        </div>

        {/* User Management Section */}
        <div className={`mb-8 p-6 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
          <h2 className="text-xl font-semibold mb-4">User Management (with TanStack Query)</h2>
          <UserList />
        </div>

        {/* Context Integration Example */}
        <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
          <h2 className="text-xl font-semibold mb-4">Context Integration Example</h2>
          <p className="mb-4">
            This demo shows how different contexts work together:
          </p>
          <ul className={`list-disc list-inside space-y-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            <li><strong>App Context:</strong> Manages authentication, UI state, and global app settings</li>
            <li><strong>Theme Context:</strong> Handles light/dark mode with localStorage persistence</li>
            <li><strong>Notification Context:</strong> Manages toast notifications and alerts</li>
            <li><strong>TanStack Query:</strong> Handles API data fetching and caching</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 