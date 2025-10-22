export interface ApiUser {
  _id: string;
  email: string;
  profileSetup: boolean;
  image?: string;
  bio?: string;
  phone?: string;
  location?: string;
  website?: string;
  firstName?: string;
  lastName?: string;
  isOnline?: boolean;
  lastSeen?: Date;
}

export interface User extends ApiUser {
  name: string;
  avatar?: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  profileSetup: boolean;
  avatar?: string;
  bio?: string;
  phone?: string;
  location?: string;
  website?: string;
  firstName?: string;
  lastName?: string;
  image?: string;
  isOnline?: boolean;
  lastSeen?: Date;
  createdAt: string;
  updatedAt: string;
}

export interface AppNotification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
  duration?: number;
}

export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  theme: "light" | "dark";
  sidebarOpen: boolean;
  notifications: AppNotification[];
  loading: boolean;
}

export type AppAction =
  | { type: "SET_USER"; payload: User | null }
  | { type: "SET_AUTHENTICATED"; payload: boolean }
  | { type: "SET_THEME"; payload: "light" | "dark" }
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "SET_SIDEBAR_OPEN"; payload: boolean }
  | { type: "ADD_NOTIFICATION"; payload: AppNotification }
  | { type: "REMOVE_NOTIFICATION"; payload: string }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "LOGOUT" };

export interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  login: (user: User) => void;
  logout: () => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  addNotification: (notification: Omit<AppNotification, "id">) => void;
  removeNotification: (id: string) => void;
  setLoading: (loading: boolean) => void;
}
