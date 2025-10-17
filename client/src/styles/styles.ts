export const styles = {
  layout: (isDark: boolean) =>
    `min-h-screen transition-colors ${
      isDark ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
    }`,

  header: (isDark: boolean) =>
    `border-b ${
      isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
    }`,

  section: (isDark: boolean) =>
    `p-6 rounded-lg shadow-md ${isDark ? "bg-gray-800" : "bg-white"}`,

  card: (isDark: boolean) =>
    `p-4 rounded-md ${isDark ? "bg-gray-700" : "bg-gray-50"}`,

  list: (isDark: boolean) =>
    `list-disc list-inside space-y-2 ${
      isDark ? "text-gray-300" : "text-gray-600"
    }`,

  button: {
    primary: "px-4 py-2 rounded-md transition-colors",
    green: "bg-green-500 text-white hover:bg-green-600",
    red: "bg-red-500 text-white hover:bg-red-600",
    blue: "bg-blue-500 text-white hover:bg-blue-600",
    yellow: "bg-yellow-500 text-white hover:bg-yellow-600",
    gray: (isDark: boolean) =>
      isDark
        ? "bg-gray-700 hover:bg-gray-600"
        : "bg-gray-200 hover:bg-gray-300",
  },
};
