import type { NotificationType } from "../types/notification";

export const notificationStyles = {
  container: "fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full",

  toast: (type: NotificationType) => {
    const baseStyles =
      "transform transition-all duration-300 ease-out animate-in slide-in-from-right-full border rounded-xl shadow-lg backdrop-blur-sm ring-1 max-w-sm w-full";

    const typeStyles = {
      success:
        "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-green-100 ring-green-500/20",
      error:
        "bg-gradient-to-r from-red-50 to-rose-50 border-red-200 shadow-red-100 ring-red-500/20",
      warning:
        "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200 shadow-yellow-100 ring-yellow-500/20",
      info: "bg-gradient-to-r from-blue-50 to-sky-50 border-blue-200 shadow-blue-100 ring-blue-500/20",
    };

    return `${baseStyles} ${typeStyles[type]}`;
  },

  text: (type: NotificationType) => {
    const textStyles = {
      success: "text-green-800",
      error: "text-red-800",
      warning: "text-yellow-800",
      info: "text-blue-800",
    };

    return textStyles[type];
  },

  progressBar: (type: NotificationType) => {
    const progressStyles = {
      success: "bg-green-500",
      error: "bg-red-500",
      warning: "bg-yellow-500",
      info: "bg-blue-500",
    };

    return progressStyles[type];
  },

  actionButton: (type: NotificationType) => {
    const baseStyles =
      "inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 bg-white/50 hover:bg-white/80 focus:outline-none focus:ring-2 focus:ring-offset-2 border border-current/20";

    const textStyles = {
      success: "text-green-800 focus:ring-green-500",
      error: "text-red-800 focus:ring-red-500",
      warning: "text-yellow-800 focus:ring-yellow-500",
      info: "text-blue-800 focus:ring-blue-500",
    };

    return `${baseStyles} ${textStyles[type]}`;
  },

  closeButton: (type: NotificationType) => {
    const ringStyles = {
      success: "focus:ring-green-500",
      error: "focus:ring-red-500",
      warning: "focus:ring-yellow-500",
      info: "focus:ring-blue-500",
    };

    return `inline-flex items-center justify-center w-6 h-6 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${ringStyles[type]}`;
  },
};
