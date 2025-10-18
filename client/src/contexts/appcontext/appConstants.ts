import { createContext } from "react";
import type { AppContextType } from "../../types/app";

export const AppContext = createContext<AppContextType | undefined>(undefined);
