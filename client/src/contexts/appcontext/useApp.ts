import { useContext } from "react";
import { AppContext } from "./appConstants"; 
import type { AppContextType } from "../../types/app";

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
