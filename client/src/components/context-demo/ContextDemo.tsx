import { useContextDemo } from "./useContextDemo";
import { styles } from "../../styles/styles";
import {
  Header,
  StateDisplay,
  ActionButtons,
  ContextInfo,
} from "./ContextDemoSubcomponents";
import { UserList } from "../UserList";

export function ContextDemo() {
  const {
    state,
    theme,
    isDark,
    handleLogin,
    handleLogout,
    handleTestNotifications,
    toggleLoading,
    toggleSidebar,
  } = useContextDemo();

  return (
    <div className={styles.layout(isDark)}>
      <Header isDark={isDark} onToggleSidebar={toggleSidebar} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <StateDisplay isDark={isDark} state={state} theme={theme} />

        <ActionButtons
          isDark={isDark}
          isAuthenticated={state.isAuthenticated}
          onLogin={handleLogin}
          onLogout={handleLogout}
          onTestNotifications={handleTestNotifications}
          onToggleLoading={toggleLoading}
        />

        {/* User Management Section */}
        <div className={styles.section(isDark)}>
          <h2 className="text-xl font-semibold mb-4">
            User Management (with TanStack Query)
          </h2>
          <UserList />
        </div>

        <ContextInfo isDark={isDark} />
      </div>
    </div>
  );
}
