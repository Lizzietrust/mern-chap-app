import { Link } from "react-router-dom";

interface NavigationLinkProps {
  to: string;
  children: React.ReactNode;
  isActive: boolean;
  isDark: boolean;
  onClick?: () => void;
  isMobile?: boolean;
}

export const NavigationLink: React.FC<NavigationLinkProps> = ({
  to,
  children,
  isActive,
  isDark,
  onClick,
  isMobile = false,
}) => {
  const baseClasses = isMobile
    ? "block px-3 py-2 rounded-md text-base font-medium transition-colors"
    : "px-3 py-2 rounded-md text-sm font-medium transition-colors";

  const activeClasses = isDark
    ? "bg-gray-700 text-white"
    : "bg-gray-100 text-gray-900";

  const inactiveClasses = isDark
    ? "text-gray-300 hover:text-white hover:bg-gray-700"
    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100";

  const className = `${baseClasses} ${
    isActive ? activeClasses : inactiveClasses
  }`;

  return (
    <Link to={to} className={className} onClick={onClick}>
      {children}
    </Link>
  );
};
