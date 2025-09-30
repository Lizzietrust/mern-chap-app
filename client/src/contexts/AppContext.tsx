import { createContext, useContext, useReducer, useEffect } from 'react'
import type { ReactNode } from 'react'
import { authApi } from '../lib/api'
import { useMe } from '../hooks/useAuth'
import { SelectedChatProvider } from './SelectedChatContext'

// Types - Updated User interface
export interface User {
  _id: string
  name: string
  email: string
  profileSetup: boolean
  avatar?: string
  bio?: string
  phone?: string
  location?: string
  website?: string
  // Add these to match your API response
  image?: string
  firstName?: string
  lastName?: string
  isOnline?: boolean
  lastSeen?: Date
}

export interface AppState {
  user: User | null
  isAuthenticated: boolean
  theme: 'light' | 'dark'
  sidebarOpen: boolean
  notifications: Notification[]
  loading: boolean
}

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

// Actions
export type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_AUTHENTICATED'; payload: boolean }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR_OPEN'; payload: boolean }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGOUT' }

// Initial state
const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  theme: 'light',
  sidebarOpen: false,
  notifications: [],
  loading: true,
}

// Reducer (same as before)
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
      }
    case 'SET_AUTHENTICATED':
      return {
        ...state,
        isAuthenticated: action.payload,
      }
    case 'SET_THEME':
      return {
        ...state,
        theme: action.payload,
      }
    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        sidebarOpen: !state.sidebarOpen,
      }
    case 'SET_SIDEBAR_OPEN':
      return {
        ...state,
        sidebarOpen: action.payload,
      }
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
      }
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(
          (notification) => notification.id !== action.payload
        ),
      }
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      }
    case 'LOGOUT':
      return {
        ...initialState,
        theme: state.theme, // Preserve theme preference
      }
    default:
      return state
  }
}

// Context
interface AppContextType {
  state: AppState
  dispatch: React.Dispatch<AppAction>
  login: (user: User) => void
  logout: () => void
  toggleTheme: () => void
  toggleSidebar: () => void
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  setLoading: (loading: boolean) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

// Provider component
interface AppProviderProps {
  children: ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Bootstrap auth from cookie using TanStack Query
  const meQuery = useMe(true)

  useEffect(() => {
    dispatch({ type: 'SET_LOADING', payload: meQuery.isFetching })
  }, [meQuery.isFetching])

  useEffect(() => {
    if (meQuery.data?.user) {
      const response = meQuery.data
      const userData: User = {
        _id: response.user._id,
        name:
          response.user.firstName && response.user.lastName
            ? `${response.user.firstName} ${response.user.lastName}`
            : response.user.email.split('@')[0],
        email: response.user.email,
        profileSetup: response.user.profileSetup,
        avatar: response.user.image,
        bio: response.user.bio,
        phone: response.user.phone,
        location: response.user.location,
        website: response.user.website,
        // Add the missing fields
        image: response.user.image,
        firstName: response.user.firstName,
        lastName: response.user.lastName,
        isOnline: response.user.isOnline,
        lastSeen: response.user.lastSeen,
      }
      dispatch({ type: 'SET_USER', payload: userData })
    }
  }, [meQuery.data])

  useEffect(() => {
    if (meQuery.isError) {
      dispatch({ type: 'SET_USER', payload: null })
    }
  }, [meQuery.isError])

  // Convenience methods (same as before)
  const login = (user: User) => {
    dispatch({ type: 'SET_USER', payload: user })
  }

  const logout = () => {
    try {
      authApi.logout().finally(() => {
        dispatch({ type: 'LOGOUT' })
      })
    } catch {
      dispatch({ type: 'LOGOUT' })
    }
  }

  const toggleTheme = () => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light'
    dispatch({ type: 'SET_THEME', payload: newTheme })
  }

  const toggleSidebar = () => {
    dispatch({ type: 'TOGGLE_SIDEBAR' })
  }

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newNotification = { ...notification, id }
    
    dispatch({ type: 'ADD_NOTIFICATION', payload: newNotification })

    const duration = notification.duration || 5000
    setTimeout(() => {
      dispatch({ type: 'REMOVE_NOTIFICATION', payload: id })
    }, duration)
  }

  const removeNotification = (id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id })
  }

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading })
  }

  const value: AppContextType = {
    state,
    dispatch,
    login,
    logout,
    toggleTheme,
    toggleSidebar,
    addNotification,
    removeNotification,
    setLoading,
  }

  return <AppContext.Provider value={value}><SelectedChatProvider>{children}</SelectedChatProvider></AppContext.Provider>
}

// Hook to use the context
export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}