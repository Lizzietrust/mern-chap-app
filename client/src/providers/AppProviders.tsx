import type { ReactNode } from 'react'
import { QueryProvider } from './QueryProvider'
import { AppProvider } from '../contexts/AppContext'
import { ThemeProvider } from '../contexts/ThemeContext'
import { NotificationProvider } from '../contexts/NotificationContext'

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AppProvider>
          <QueryProvider>
            {children}
          </QueryProvider>
        </AppProvider>
      </NotificationProvider>
    </ThemeProvider>
  )
} 