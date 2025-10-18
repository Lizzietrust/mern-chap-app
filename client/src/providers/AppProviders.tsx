import type { ReactNode } from 'react'
import { AppProvider } from '../contexts/AppContext'
import { ThemeProvider } from '../contexts/ThemeContext'
import { NotificationProvider } from '../contexts'
import { QueryProvider } from './QueryProvider'
import { SocketProvider } from '../contexts/SocketContext'

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <NotificationProvider>
          <AppProvider>
            <SocketProvider>{children}</SocketProvider>
          </AppProvider>
        </NotificationProvider>
      </ThemeProvider>
    </QueryProvider>
  )
} 