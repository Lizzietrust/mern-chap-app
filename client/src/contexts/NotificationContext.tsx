import { createContext, useContext, useReducer, useEffect } from 'react'
import type { ReactNode } from 'react'

// Types
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  duration?: number
  persistent?: boolean
  action?: {
    label: string
    onClick: () => void
  }
}

interface NotificationState {
  notifications: Notification[]
}

// Actions
type NotificationAction =
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_ALL' }

// Initial state
const initialState: NotificationState = {
  notifications: [],
}

// Reducer
function notificationReducer(state: NotificationState, action: NotificationAction): NotificationState {
  switch (action.type) {
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
    
    case 'CLEAR_ALL':
      return {
        ...state,
        notifications: [],
      }
    
    default:
      return state
  }
}

// Context
interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id'>) => string
  removeNotification: (id: string) => void
  clearAll: () => void
  // Convenience methods
  success: (message: string, title?: string) => string
  error: (message: string, title?: string) => string
  warning: (message: string, title?: string) => string
  info: (message: string, title?: string) => string
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

// Provider component
interface NotificationProviderProps {
  children: ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [state, dispatch] = useReducer(notificationReducer, initialState)

  const addNotification = (notification: Omit<Notification, 'id'>): string => {
    const id = Math.random().toString(36).substr(2, 9)
    const newNotification = { ...notification, id }
    
    dispatch({ type: 'ADD_NOTIFICATION', payload: newNotification })

    // Auto-remove notification after duration (unless persistent)
    if (!notification.persistent) {
      const duration = notification.duration || 5000
      setTimeout(() => {
        dispatch({ type: 'REMOVE_NOTIFICATION', payload: id })
      }, duration)
    }

    return id
  }

  const removeNotification = (id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id })
  }

  const clearAll = () => {
    dispatch({ type: 'CLEAR_ALL' })
  }

  // Convenience methods
  const success = (message: string, title?: string) => {
    return addNotification({ type: 'success', message, title })
  }

  const error = (message: string, title?: string) => {
    return addNotification({ type: 'error', message, title })
  }

  const warning = (message: string, title?: string) => {
    return addNotification({ type: 'warning', message, title })
  }

  const info = (message: string, title?: string) => {
    return addNotification({ type: 'info', message, title })
  }

  const value: NotificationContextType = {
    notifications: state.notifications,
    addNotification,
    removeNotification,
    clearAll,
    success,
    error,
    warning,
    info,
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

// Hook to use the context
export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
} 