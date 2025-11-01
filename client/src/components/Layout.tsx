import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Navigation } from "./navigation/Navigation";
import { useApp } from "../contexts/appcontext/index";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { state } = useApp();
  const location = useLocation();

  const isChatPage =
    location.pathname === "/chat" || location.pathname.startsWith("/chat/");

  if (!state.isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen">
      {!isChatPage && <Navigation />}
      <main>{children}</main>
    </div>
  );
}
