import type { ReactNode } from 'react'
import { Navigation } from './Navigation'
import { useApp } from '../contexts/AppContext'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { state } = useApp()

  // Don't show navigation for auth pages
  if (!state.isAuthenticated) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      <main>{children}</main>
    </div>
  )
} 