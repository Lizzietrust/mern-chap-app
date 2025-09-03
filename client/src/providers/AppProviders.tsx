import type { ReactNode } from 'react'
import { AppProvider } from '../contexts/AppContext'
import { ThemeProvider } from '../contexts/ThemeContext'
import { NotificationProvider } from '../contexts/NotificationContext'
import { QueryProvider } from './QueryProvider'

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <NotificationProvider>
          <AppProvider>
            {children}
          </AppProvider>
        </NotificationProvider>
      </ThemeProvider>
    </QueryProvider>
  )
} 