import { useReducer } from "react";
import type { ReactNode } from "react";
import { SelectedChatProvider } from "../selectedChatContext";
import { AppLogic } from "../AppLogic";
import { appReducer, initialState } from "../reducers/appReducer";
import { AppContext } from "./appConstants";
// import type { AppState, AppAction } from "../../types/app";

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const placeholderActions = {
    login: () => {},
    logout: () => {},
    toggleTheme: () => {},
    toggleSidebar: () => {},
    addNotification: () => {},
    removeNotification: () => {},
    setLoading: () => {},
  };

  return (
    <AppContext.Provider value={{ state, dispatch, ...placeholderActions }}>
      <SelectedChatProvider>
        <AppLogic state={state} dispatch={dispatch}>
          {children}
        </AppLogic>
      </SelectedChatProvider>
    </AppContext.Provider>
  );
}
