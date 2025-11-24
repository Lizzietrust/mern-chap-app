import { useReducer } from "react";
import type { ReactNode } from "react";
import { SelectedChatProvider } from "./selectedChatContext";
import { AppLogic } from "./AppLogic";
import { appReducer, initialState } from "./reducers/appReducer";
import { AppContext } from "./appcontext/appConstants";
import { ChatProvider } from "./chat";
import { CallProvider } from "./call/CallProvider";

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const contextValue = {
    state,
    dispatch,
    socket: state.socket,
    login: () => {},
    logout: () => {},
    toggleTheme: () => {},
    toggleSidebar: () => {},
    addNotification: () => {},
    removeNotification: () => {},
    setLoading: () => {},
  };

  return (
    <AppContext.Provider value={contextValue}>
      <SelectedChatProvider>
        <ChatProvider>
          <CallProvider>
            <AppLogic state={state} dispatch={dispatch}>
              {children}
            </AppLogic>
          </CallProvider>
        </ChatProvider>
      </SelectedChatProvider>
    </AppContext.Provider>
  );
}
