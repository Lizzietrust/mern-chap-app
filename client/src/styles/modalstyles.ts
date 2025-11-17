export const modalStyles = {
  overlay:
    "fixed inset-0 bg-white/30 bg-opacity-50 flex items-center justify-center p-4 z-50",

  container: (isDark: boolean) =>
    `${
      isDark ? "bg-gray-800" : "bg-white"
    } rounded-lg shadow-xl max-w-md w-full`,

  text: {
    title: (isDark: boolean) =>
      `text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"} mb-2`,

    subtitle: (isDark: boolean) =>
      `${isDark ? "text-gray-300" : "text-gray-600"} mb-6`,
  },

  buttons: {
    cancel: (isDark: boolean, isLoading: boolean) =>
      `px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 ${
        isLoading ? "opacity-50 cursor-not-allowed" : ""
      } ${
        isDark
          ? "bg-gray-700 text-gray-200 hover:bg-gray-600 focus:ring-gray-500"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500"
      }`,

    confirm: (isLoading: boolean) =>
      `px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded-md transition-colors duration-200 ${
        isLoading ? "opacity-50 cursor-not-allowed" : ""
      }`,
  },
};
