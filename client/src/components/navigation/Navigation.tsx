import { useApp } from "../../contexts/AppContext";
import { useTheme } from "../../contexts/ThemeContext";
import { ThemeToggle } from "../ui/ThemeToggle";
import { LogoutButton } from "../LogoutButton";
import { useNavigation } from "../../hooks/useNavigation";
import { navigationStyles } from "../../styles/navigationStyles";
import { NavigationLink } from "./NavigationLink";
import { MobileMenu } from "./MobileMenu";
import { MenuIcon, CloseIcon } from "../ui/icons";

export function Navigation() {
  const { state } = useApp();
  const { isDark } = useTheme();
  const { isMobileMenuOpen, toggleMobileMenu, closeMobileMenu, isActive } =
    useNavigation();

  if (!state.isAuthenticated) {
    return null;
  }

  const navigationItems = [
    { path: "/profile", label: "Profile" },
    { path: "/chat", label: "Chat" },
  ];

  return (
    <nav className={navigationStyles.nav(isDark)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Section - Brand & Desktop Navigation */}
          <div className="flex items-center space-x-8">
            <a href="/profile" className={navigationStyles.brand(isDark)}>
              Neon Chat
            </a>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex space-x-4">
              {navigationItems.map((item) => (
                <NavigationLink
                  key={item.path}
                  to={item.path}
                  isActive={isActive(item.path)}
                  isDark={isDark}
                >
                  {item.label}
                </NavigationLink>
              ))}
            </div>
          </div>

          {/* Desktop Right Section */}
          <div className="hidden md:flex items-center space-x-4">
            <span className={navigationStyles.welcomeText(isDark)}>
              Welcome, {state.user?.name}
            </span>
            <ThemeToggle />
            <LogoutButton isNav={true} />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMobileMenu}
              type="button"
              className={navigationStyles.mobileMenuButton(isDark)}
              aria-controls="mobile-menu"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">
                {isMobileMenuOpen ? "Close main menu" : "Open main menu"}
              </span>
              {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        isDark={isDark}
        isActive={isActive}
        userName={state.user?.name}
        onLinkClick={closeMobileMenu}
      />
    </nav>
  );
}
