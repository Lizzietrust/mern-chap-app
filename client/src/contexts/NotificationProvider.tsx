import type { ReactNode } from "react";
import { NotificationContext } from "./NotificationContext";
import { useNotificationLogic } from "../hooks/useNotificationlogic";

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const notificationLogic = useNotificationLogic();

  return (
    <NotificationContext.Provider value={notificationLogic}>
      {children}
    </NotificationContext.Provider>
  );
}
