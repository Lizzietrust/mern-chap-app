import { useReducer, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { SelectedChatProvider } from "../selectedChatContext";
import { AppLogic } from "../AppLogic";
import { appReducer, initialState } from "../reducers/appReducer";
import { AppContext } from "./appConstants";
import type { User, AppNotification } from "../../types/types";
import { ChatProvider } from "../chat";
import { CallProvider } from "../call/CallProvider";

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io("http://localhost:5000");

    newSocket.on("connect", () => {
      console.log("Connected to server with ID:", newSocket.id);

      if (state.user?._id) {
        console.log("🔐 Identifying socket with user ID:", state.user._id);
        newSocket.emit("identify", state.user._id);
      }
    });

    newSocket.on("disconnect", (reason) => {
      console.log("❌ Disconnected from server:", reason);
    });

    newSocket.on("connect_error", (error) => {
      console.error("🔌 Socket connection error:", error);
    });

    newSocket.on("profile_updated", (data) => {
      console.log("🌍 Global profile_updated event received:", data);
    });

    setSocket(newSocket);

    return () => {
      console.log("🧹 Cleaning up socket connection");
      newSocket.off("profile_updated");
      newSocket.disconnect();
    };
  }, [state.user?._id]);

  useEffect(() => {
    if (socket && state.user?._id) {
      console.log("🔐 Identifying socket with user ID:", state.user._id);
      socket.emit("identify", state.user._id);
    }
  }, [state.user?._id, socket]);

  const login = (user: User) => {
    dispatch({ type: "LOGIN", payload: user });

    if (socket && user._id) {
      console.log("🔐 Identifying socket after login:", user._id);
      socket.emit("identify", user._id);
    }
  };

  const logout = () => {
    dispatch({ type: "LOGOUT" });
  };

  const toggleTheme = () => {
    dispatch({ type: "TOGGLE_THEME" });
  };

  const toggleSidebar = () => {
    dispatch({ type: "TOGGLE_SIDEBAR" });
  };

  const addNotification = (notification: Omit<AppNotification, "id">) => {
    const completeNotification: AppNotification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
    };
    dispatch({ type: "ADD_NOTIFICATION", payload: completeNotification });
  };

  const removeNotification = (id: string) => {
    dispatch({ type: "REMOVE_NOTIFICATION", payload: id });
  };

  const setLoading = (loading: boolean) => {
    dispatch({ type: "SET_LOADING", payload: loading });
  };

  const contextValue = {
    state,
    dispatch,
    login,
    logout,
    toggleTheme,
    toggleSidebar,
    addNotification,
    removeNotification,
    setLoading,
    socket,
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
