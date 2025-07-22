# React Router Setup with Authentication

This project is configured with React Router for client-side routing, including authentication-based route protection and a complete navigation system.

## Overview

The routing setup provides:
- **Authentication-based routing** with protected routes
- **Public routes** for login and registration
- **Protected routes** for authenticated users
- **Automatic redirects** based on authentication status
- **Navigation component** for authenticated users
- **Layout wrapper** for consistent UI

## Route Structure

### Public Routes (Unauthenticated)
- `/login` - User login page
- `/register` - User registration page

### Protected Routes (Authenticated)
- `/profile` - User profile management
- `/chat` - Chat interface

### Default Routes
- `/` - Redirects to `/profile` if authenticated, `/login` if not
- `*` - Catch-all route with same logic as `/`

## Components

### 1. AppRouter (`src/router/AppRouter.tsx`)

Main router configuration with authentication-based routing logic.

```typescript
<BrowserRouter>
  <Routes>
    {/* Public routes */}
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    
    {/* Protected routes */}
    <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
    <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
    
    {/* Default redirects */}
    <Route path="/" element={<Navigate to="/profile" replace />} />
  </Routes>
</BrowserRouter>
```

### 2. ProtectedRoute (`src/components/ProtectedRoute.tsx`)

Route guard that redirects unauthenticated users to login.

```typescript
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { state } = useApp()
  const location = useLocation()

  if (!state.isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
```

### 3. Navigation (`src/components/Navigation.tsx`)

Navigation bar for authenticated users with active route highlighting.

### 4. Layout (`src/components/Layout.tsx`)

Layout wrapper that includes navigation for authenticated pages.

## Authentication Flow

### Login Process
1. User visits `/login` or any protected route
2. If not authenticated, redirected to `/login`
3. After successful login, redirected to intended destination or `/profile`
4. Navigation bar appears for authenticated users

### Logout Process
1. User clicks logout button
2. User state is cleared
3. Redirected to `/login`
4. Navigation bar disappears

### Route Protection
- **Protected routes** automatically redirect to login if not authenticated
- **Public routes** redirect to profile if already authenticated
- **Return path** is preserved during login redirect

## Usage Examples

### Basic Navigation
```typescript
import { Link, useNavigate } from 'react-router-dom'

function MyComponent() {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate('/chat')
  }

  return (
    <div>
      <Link to="/profile">Go to Profile</Link>
      <button onClick={handleClick}>Go to Chat</button>
    </div>
  )
}
```

### Programmatic Navigation with Return Path
```typescript
// In LoginPage.tsx
const location = useLocation()
const navigate = useNavigate()

const handleLogin = () => {
  // After successful login
  const from = location.state?.from?.pathname || '/profile'
  navigate(from, { replace: true })
}
```

### Route Parameters (Future Enhancement)
```typescript
// Example for future chat rooms
<Route path="/chat/:roomId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />

// In component
const { roomId } = useParams()
```

## Page Components

### 1. LoginPage (`src/pages/auth/LoginPage.tsx`)
- Email/password form
- Form validation
- Loading states
- Error handling
- Link to registration

### 2. RegisterPage (`src/pages/auth/RegisterPage.tsx`)
- Registration form with validation
- Password confirmation
- Terms agreement
- Link to login

### 3. ProfilePage (`src/pages/ProfilePage.tsx`)
- User profile display
- Editable profile form
- Avatar upload (placeholder)
- Bio management

### 4. ChatPage (`src/pages/ChatPage.tsx`)
- Real-time chat interface
- Message history
- Typing indicators
- Message input with validation

## Styling and Theming

### Dark Mode Support
All pages support dark mode with consistent theming:
- Automatic theme detection
- Manual theme toggle
- Persistent theme preference
- Smooth transitions

### Responsive Design
- Mobile-first approach
- Responsive navigation
- Adaptive layouts
- Touch-friendly interfaces

## State Management Integration

### Context Integration
- **AppContext**: Authentication state and user data
- **ThemeContext**: Theme preferences
- **NotificationContext**: Toast notifications

### Route State
- Authentication status determines available routes
- User data available throughout the app
- Persistent login state (can be enhanced with localStorage)

## Best Practices

### 1. Route Organization
- Group related routes together
- Use descriptive route names
- Implement lazy loading for large pages
- Keep route logic simple

### 2. Authentication
- Always check authentication before rendering protected content
- Provide clear feedback for authentication errors
- Implement proper logout cleanup
- Consider token refresh mechanisms

### 3. Navigation
- Use semantic route names
- Provide breadcrumbs for complex navigation
- Implement active route highlighting
- Add loading states for route transitions

### 4. Error Handling
- Implement 404 pages
- Handle authentication errors gracefully
- Provide fallback routes
- Log routing errors

## Future Enhancements

### 1. Advanced Routing
```typescript
// Nested routes
<Route path="/dashboard" element={<DashboardLayout />}>
  <Route index element={<DashboardHome />} />
  <Route path="settings" element={<Settings />} />
  <Route path="analytics" element={<Analytics />} />
</Route>
```

### 2. Route Guards
```typescript
// Role-based access
<Route 
  path="/admin" 
  element={
    <RoleGuard roles={['admin']}>
      <AdminPanel />
    </RoleGuard>
  } 
/>
```

### 3. Lazy Loading
```typescript
const ChatPage = lazy(() => import('../pages/ChatPage'))

<Route 
  path="/chat" 
  element={
    <Suspense fallback={<LoadingSpinner />}>
      <ProtectedRoute>
        <ChatPage />
      </ProtectedRoute>
    </Suspense>
  } 
/>
```

### 4. Route Analytics
```typescript
// Track page views
useEffect(() => {
  analytics.trackPageView(location.pathname)
}, [location])
```

## Troubleshooting

### Common Issues

1. **Infinite redirects**
   - Check authentication state logic
   - Verify route protection conditions
   - Ensure proper state updates

2. **Navigation not working**
   - Check BrowserRouter wrapper
   - Verify route definitions
   - Check for JavaScript errors

3. **Protected routes accessible**
   - Verify ProtectedRoute component
   - Check authentication state
   - Ensure proper context usage

### Debug Tools
- React Router DevTools
- Browser developer tools
- Network tab for API calls
- Console for JavaScript errors

This routing setup provides a solid foundation for building scalable React applications with proper authentication and navigation. 