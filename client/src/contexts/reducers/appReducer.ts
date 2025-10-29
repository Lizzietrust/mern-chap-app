import type { AppState, AppAction } from "../../types/app";

export const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  theme: "light",
  sidebarOpen: false,
  notifications: [],
  loading: true,
  socket: null,
  onlineUsers: [],
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_USER":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
      };
    case "SET_AUTHENTICATED":
      return {
        ...state,
        isAuthenticated: action.payload,
      };
    case "SET_THEME":
      return {
        ...state,
        theme: action.payload,
      };
    case "TOGGLE_SIDEBAR":
      return {
        ...state,
        sidebarOpen: !state.sidebarOpen,
      };
    case "SET_SIDEBAR_OPEN":
      return {
        ...state,
        sidebarOpen: action.payload,
      };
    case "ADD_NOTIFICATION":
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
      };
    case "REMOVE_NOTIFICATION":
      return {
        ...state,
        notifications: state.notifications.filter(
          (notification) => notification.id !== action.payload
        ),
      };
    case "SET_LOADING":
      return {
        ...state,
        loading: action.payload,
      };
    case "LOGOUT":
      return {
        ...initialState,
        theme: state.theme,
      };
    case "SET_SOCKET":
      return {
        ...state,
        socket: action.payload,
      };
    case "SET_ONLINE_USERS":
      return {
        ...state,
        onlineUsers: action.payload,
      };
    default:
      return state;
  }
}
