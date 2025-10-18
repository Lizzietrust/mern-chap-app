import type { ReactNode } from "react";
import { Navigation } from "./navigation/Navigation";
import { useApp } from "../contexts/appcontext/index";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { state } = useApp();

  if (!state.isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      <main>{children}</main>
    </div>
  );
}
