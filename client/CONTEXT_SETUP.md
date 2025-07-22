# React Context State Management Setup

This project is configured with a comprehensive React Context setup for state management, working seamlessly with TanStack Query for API data.

## Overview

The context setup provides:

- **App Context**: Global application state (auth, UI state, settings)
- **Theme Context**: Light/dark mode with localStorage persistence
- **Notification Context**: Toast notifications and alerts
- **TanStack Query**: API data fetching and caching

## Context Architecture

### Provider Hierarchy

```
AppProviders
├── ThemeProvider
├── NotificationProvider
├── AppProvider
└── QueryProvider
    └── Your App Components
```

## 1. App Context (`src/contexts/AppContext.tsx`)

Manages global application state including authentication, UI state, and app settings.

### State Structure

```typescript
interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  theme: "light" | "dark";
  sidebarOpen: boolean;
  notifications: Notification[];
  loading: boolean;
}
```

### Usage

```typescript
import { useApp } from "../contexts/AppContext";

function MyComponent() {
  const {
    state,
    login,
    logout,
    toggleTheme,
    toggleSidebar,
    addNotification,
    setLoading,
  } = useApp();

  // Access state
  const { user, isAuthenticated, loading } = state;

  // Use actions
  const handleLogin = () => {
    login(userData);
  };

  const handleLogout = () => {
    logout();
  };
}
```

## 2. Theme Context (`src/contexts/ThemeContext.tsx`)

Handles theme switching with localStorage persistence and system preference detection.

### Features

- Light/dark mode switching
- localStorage persistence
- System preference detection
- Automatic theme application to document

### Usage

```typescript
import { useTheme } from "../contexts/ThemeContext";

function ThemeToggle() {
  const { theme, toggleTheme, isDark, setTheme } = useTheme();

  return <button onClick={toggleTheme}>{isDark ? "🌞" : "🌙"}</button>;
}
```

## 3. Notification Context (`src/contexts/NotificationContext.tsx`)

Manages toast notifications with auto-dismiss and action support.

### Features

- Multiple notification types (success, error, warning, info)
- Auto-dismiss with configurable duration
- Persistent notifications
- Action buttons
- Convenience methods

### Usage

```typescript
import { useNotifications } from "../contexts/NotificationContext";

function MyComponent() {
  const { success, error, warning, info, addNotification } = useNotifications();

  // Convenience methods
  success("Operation completed!", "Success");
  error("Something went wrong!", "Error");
  warning("Please check your input", "Warning");
  info("Here is some information", "Info");

  // Custom notification
  addNotification({
    type: "success",
    title: "Custom Title",
    message: "Custom message",
    duration: 10000, // 10 seconds
    persistent: false,
    action: {
      label: "Undo",
      onClick: () => handleUndo(),
    },
  });
}
```

## 4. Combined Providers (`src/providers/AppProviders.tsx`)

Wraps all contexts in the correct order for optimal performance.

### Provider Order

1. **ThemeProvider**: Outermost for theme application
2. **NotificationProvider**: For notification management
3. **AppProvider**: For global app state
4. **QueryProvider**: For API data management

## Usage Examples

### Basic Component with Multiple Contexts

```typescript
import { useApp } from "../contexts/AppContext";
import { useTheme } from "../contexts/ThemeContext";
import { useNotifications } from "../contexts/NotificationContext";

function MyComponent() {
  const { state, login } = useApp();
  const { isDark } = useTheme();
  const { success } = useNotifications();

  const handleLogin = async (credentials) => {
    try {
      const user = await loginUser(credentials);
      login(user);
      success("Successfully logged in!");
    } catch (error) {
      // Error handling
    }
  };

  return <div className={isDark ? "dark" : ""}>{/* Component content */}</div>;
}
```

### Integration with TanStack Query

```typescript
import { useCreateUser } from "../hooks/useUsers";
import { useNotifications } from "../contexts/NotificationContext";

function CreateUserForm() {
  const createUserMutation = useCreateUser();
  const { success, error } = useNotifications();

  const handleSubmit = (userData) => {
    createUserMutation.mutate(userData, {
      onSuccess: (newUser) => {
        success(`User ${newUser.name} created successfully!`);
      },
      onError: (err) => {
        error("Failed to create user: " + err.message);
      },
    });
  };
}
```

## Best Practices

### 1. Context Organization

- Keep contexts focused on specific concerns
- Use reducer pattern for complex state
- Provide convenience methods for common actions

### 2. Performance

- Use `useMemo` for expensive computations
- Avoid unnecessary re-renders with proper dependency arrays
- Consider context splitting for large applications

### 3. TypeScript

- Define proper types for all state and actions
- Use discriminated unions for actions
- Export types for reuse across components

### 4. Error Handling

- Always handle context usage errors
- Provide fallback values where appropriate
- Use error boundaries for context errors

## Adding New Contexts

### 1. Create Context File

```typescript
// src/contexts/NewContext.tsx
import { createContext, useContext, useReducer } from "react";
import type { ReactNode } from "react";

// Define types
interface NewState {
  // your state properties
}

type NewAction =
  | { type: "ACTION_1"; payload: any }
  | { type: "ACTION_2"; payload: any };

// Create context
const NewContext = createContext<NewContextType | undefined>(undefined);

// Provider component
export function NewProvider({ children }: { children: ReactNode }) {
  // Implementation
}

// Hook
export function useNew() {
  const context = useContext(NewContext);
  if (!context) {
    throw new Error("useNew must be used within NewProvider");
  }
  return context;
}
```

### 2. Add to AppProviders

```typescript
// src/providers/AppProviders.tsx
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <NewProvider>
          <AppProvider>
            <QueryProvider>{children}</QueryProvider>
          </AppProvider>
        </NewProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}
```

## Migration from Other State Management

### From Redux

- Replace `useSelector` with context hooks
- Replace `useDispatch` with context actions
- Convert reducers to context reducers

### From Zustand

- Replace store hooks with context hooks
- Convert store actions to context actions
- Update component imports

### From MobX

- Replace observable state with context state
- Convert actions to context actions
- Remove decorators and observables

## Troubleshooting

### Common Issues

1. **Context not found error**

   - Ensure component is wrapped in the correct provider
   - Check provider hierarchy order

2. **Performance issues**

   - Use `useMemo` for expensive computations
   - Consider context splitting
   - Check for unnecessary re-renders

3. **State not updating**
   - Verify action types match reducer cases
   - Check for immutable state updates
   - Ensure proper dependency arrays

### Debug Tools

- React DevTools for context inspection
- TanStack Query DevTools for API state
- Browser localStorage for theme persistence

## Environment Variables

```env
# API Configuration
VITE_API_URL=http://localhost:5000

# Theme Configuration
VITE_DEFAULT_THEME=light
```

This setup provides a robust foundation for state management in React applications, combining the power of Context API with TanStack Query for a complete solution.
