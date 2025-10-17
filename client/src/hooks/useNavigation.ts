import { useState } from "react";
import { useLocation } from "react-router-dom";

export function useNavigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return {
    isMobileMenuOpen,
    toggleMobileMenu,
    closeMobileMenu,
    isActive,
    currentPath: location.pathname,
  };
}
