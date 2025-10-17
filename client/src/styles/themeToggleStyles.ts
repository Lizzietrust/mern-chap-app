export const themeToggleStyles = {
  button: (isDark: boolean) =>
    `p-2 rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 ${
      isDark
        ? "bg-gray-200 hover:bg-gray-300 focus:ring-gray-400 text-yellow-500"
        : "bg-gray-500 hover:bg-gray-600 focus:ring-gray-500 text-gray-700"
    }`,
};
