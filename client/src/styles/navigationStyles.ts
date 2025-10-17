export const navigationStyles = {
  // Base styles
  nav: (isDark: boolean) =>
    `border-b ${
      isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
    }`,

  // Logo/Brand
  brand: (isDark: boolean) =>
    `text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`,

  // Navigation links
  navLink: (isActive: boolean, isDark: boolean) => {
    const baseClasses =
      "px-3 py-2 rounded-md text-sm font-medium transition-colors";

    if (isActive) {
      return `${baseClasses} ${
        isDark ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-900"
      }`;
    }

    return `${baseClasses} ${
      isDark
        ? "text-gray-300 hover:text-white hover:bg-gray-700"
        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
    }`;
  },

  // Welcome text
  welcomeText: (isDark: boolean) =>
    `text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`,

  // Mobile menu button
  mobileMenuButton: (isDark: boolean) =>
    `inline-flex items-center justify-center p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--accent-500)] ${
      isDark
        ? "text-gray-400 hover:text-white hover:bg-gray-700"
        : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
    }`,

  // Mobile menu container
  mobileMenu: (isDark: boolean) =>
    `md:hidden ${isDark ? "bg-gray-800" : "bg-white"}`,
};
