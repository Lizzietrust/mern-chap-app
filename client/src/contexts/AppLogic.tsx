import React from "react";
import type { ReactNode } from "react";
import { useAppLogic } from "../hooks/useAppLogic";
import { AppContext } from "../contexts/appcontext/appConstants";
import type { AppContextType, AppState, AppAction } from "../types/app";

interface AppLogicProps {
  children: ReactNode;
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

export const AppLogic: React.FC<AppLogicProps> = ({
  children,
  state,
  dispatch,
}) => {
  const actions = useAppLogic({ state, dispatch });

  const contextValue: AppContextType = {
    state,
    dispatch,
    socket: state.socket, 
    ...actions,
  };

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
};
