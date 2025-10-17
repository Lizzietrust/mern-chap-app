import React from "react";
import { ThemeToggle } from "../ThemeToggle";
// import { UserList } from "../chat/new-chat-modal/UserList";
import { styles } from "../../styles/styles";
import type { StateCard } from "../../types/types";
import type { AppState } from "../../contexts/AppContext";

interface HeaderProps {
  isDark: boolean;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isDark, onToggleSidebar }) => (
  <header className={styles.header(isDark)}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center py-4">
        <h1 className="text-2xl font-bold">Context State Management Demo</h1>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <button
            onClick={onToggleSidebar}
            className={`${styles.button.primary} ${styles.button.gray(isDark)}`}
          >
            Toggle Sidebar
          </button>
        </div>
      </div>
    </div>
  </header>
);

interface StateDisplayProps {
  isDark: boolean;
  state: AppState;
  theme: string;
}

export const StateDisplay: React.FC<StateDisplayProps> = ({
  isDark,
  state,
  theme,
}) => {
  const stateCards: StateCard[] = [
    {
      title: "Authentication",
      items: [
        {
          label: "Status",
          value: state.isAuthenticated ? "Logged In" : "Not Logged In",
        },
        ...(state.user ? [{ label: "User", value: state.user.name }] : []),
      ],
    },
    {
      title: "Theme",
      items: [
        { label: "Current", value: theme },
        { label: "Mode", value: isDark ? "Dark" : "Light" },
      ],
    },
    {
      title: "UI State",
      items: [
        { label: "Sidebar", value: state.sidebarOpen ? "Open" : "Closed" },
        { label: "Loading", value: state.loading ? "Yes" : "No" },
      ],
    },
  ];

  return (
    <div className={styles.section(isDark)}>
      <h2 className="text-xl font-semibold mb-4">Current App State</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stateCards.map((card, index) => (
          <div key={index} className={styles.card(isDark)}>
            <h3 className="font-medium mb-2">{card.title}</h3>
            {card.items.map((item, itemIndex) => (
              <p key={itemIndex}>
                {item.label}: {String(item.value)}
              </p>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

interface ActionButtonsProps {
  isDark: boolean;
  isAuthenticated: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onTestNotifications: () => void;
  onToggleLoading: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  isDark,
  isAuthenticated,
  onLogin,
  onLogout,
  onTestNotifications,
  onToggleLoading,
}) => (
  <div className={styles.section(isDark)}>
    <h2 className="text-xl font-semibold mb-4">Actions</h2>
    <div className="flex flex-wrap gap-4">
      {!isAuthenticated ? (
        <button
          onClick={onLogin}
          className={`${styles.button.primary} ${styles.button.green}`}
        >
          Login
        </button>
      ) : (
        <button
          onClick={onLogout}
          className={`${styles.button.primary} ${styles.button.red}`}
        >
          Logout
        </button>
      )}

      <button
        onClick={onTestNotifications}
        className={`${styles.button.primary} ${styles.button.blue}`}
      >
        Test Notifications
      </button>

      <button
        onClick={onToggleLoading}
        className={`${styles.button.primary} ${styles.button.yellow}`}
      >
        Toggle Loading
      </button>
    </div>
  </div>
);

interface ContextInfoProps {
  isDark: boolean;
}

export const ContextInfo: React.FC<ContextInfoProps> = ({ isDark }) => (
  <div className={styles.section(isDark)}>
    <h2 className="text-xl font-semibold mb-4">Context Integration Example</h2>
    <p className="mb-4">
      This demo shows how different contexts work together:
    </p>
    <ul className={styles.list(isDark)}>
      <li>
        <strong>App Context:</strong> Manages authentication, UI state, and
        global app settings
      </li>
      <li>
        <strong>Theme Context:</strong> Handles light/dark mode with
        localStorage persistence
      </li>
      <li>
        <strong>Notification Context:</strong> Manages toast notifications and
        alerts
      </li>
      <li>
        <strong>TanStack Query:</strong> Handles API data fetching and caching
      </li>
    </ul>
  </div>
);
