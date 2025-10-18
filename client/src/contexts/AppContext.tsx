import { useReducer } from "react";
import type { ReactNode } from "react";
import { SelectedChatProvider } from "./selectedChatContext";
import { AppLogic } from "./AppLogic";
import { appReducer, initialState } from "./reducers/appReducer";
import { AppContext } from "./appcontext/appConstants";

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        login: () => {},
        logout: () => {},
        toggleTheme: () => {},
        toggleSidebar: () => {},
        addNotification: () => {},
        removeNotification: () => {},
        setLoading: () => {},
      }}
    >
      <SelectedChatProvider>
        <AppLogic state={state} dispatch={dispatch}>
          {children}
        </AppLogic>
      </SelectedChatProvider>
    </AppContext.Provider>
  );
}
