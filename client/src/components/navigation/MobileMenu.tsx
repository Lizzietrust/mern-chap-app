import { NavigationLink } from "./NavigationLink";

interface MobileMenuProps {
  isOpen: boolean;
  isDark: boolean;
  isActive: (path: string) => boolean;
  userName?: string;
  onLinkClick: () => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  isDark,
  isActive,
  userName,
  onLinkClick,
}) => {
  if (!isOpen) return null;

  return (
    <div className="md:hidden">
      <div
        className={`px-2 pt-2 pb-3 space-y-1 sm:px-3 ${
          isDark ? "bg-gray-800" : "bg-white"
        }`}
      >
        <NavigationLink
          to="/profile"
          isActive={isActive("/profile")}
          isDark={isDark}
          onClick={onLinkClick}
          isMobile={true}
        >
          Profile
        </NavigationLink>

        <NavigationLink
          to="/chat"
          isActive={isActive("/chat")}
          isDark={isDark}
          onClick={onLinkClick}
          isMobile={true}
        >
          Chat
        </NavigationLink>

        <div className="flex items-center justify-between px-3 py-2">
          <span
            className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}
          >
            Welcome, {userName}
          </span>
          <div className="flex items-center space-x-2">
            {/* ThemeToggle and LogoutButton will be injected */}
          </div>
        </div>
      </div>
    </div>
  );
};
