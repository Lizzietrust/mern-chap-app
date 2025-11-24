import React, { useState, useEffect } from "react";
import { ChatContext, type ChatContextType } from "./chat-context";

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [activeTab, setActiveTab] = useState<"direct" | "channels">(() => {
    const savedTab = localStorage.getItem("sidebar-active-tab");
    return savedTab === "direct" || savedTab === "channels"
      ? savedTab
      : "direct";
  });

  useEffect(() => {
    localStorage.setItem("sidebar-active-tab", activeTab);
  }, [activeTab]);

  const value: ChatContextType = {
    activeTab,
    setActiveTab,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
