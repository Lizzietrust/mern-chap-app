import { useNotifications } from "../../contexts";
import {
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

export function NotificationToast() {
  const { notifications, removeNotification } = useNotifications();
  const [progressBars, setProgressBars] = useState<Record<string, number>>({});

  useEffect(() => {
    const intervals: Record<string, ReturnType<typeof setInterval>> = {};

    notifications.forEach((notification) => {
      if (!notification.persistent && notification.duration) {
        const duration = notification.duration;
        const startTime = Date.now();

        intervals[notification.id] = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const progress = Math.max(0, 100 - (elapsed / duration) * 100);

          setProgressBars((prev) => ({
            ...prev,
            [notification.id]: progress,
          }));

          if (progress <= 0) {
            clearInterval(intervals[notification.id]);
          }
        }, 10);
      }
    });

    return () => {
      Object.values(intervals).forEach(clearInterval);
    };
  }, [notifications]);

  const getIcon = (type: string) => {
    const iconClasses = "w-6 h-6";

    switch (type) {
      case "success":
        return <CheckCircleIcon className={`${iconClasses} text-green-500`} />;
      case "error":
        return (
          <ExclamationCircleIcon className={`${iconClasses} text-red-500`} />
        );
      case "warning":
        return (
          <ExclamationTriangleIcon
            className={`${iconClasses} text-yellow-500`}
          />
        );
      case "info":
        return (
          <InformationCircleIcon className={`${iconClasses} text-blue-500`} />
        );
      default:
        return null;
    }
  };

  const getStyles = (type: string) => {
    switch (type) {
      case "success":
        return {
          bg: "bg-gradient-to-r from-green-50 to-emerald-50",
          border: "border-green-200",
          text: "text-green-800",
          progress: "bg-green-500",
          shadow: "shadow-green-100",
          ring: "ring-green-500/20",
        };
      case "error":
        return {
          bg: "bg-gradient-to-r from-red-50 to-rose-50",
          border: "border-red-200",
          text: "text-red-800",
          progress: "bg-red-500",
          shadow: "shadow-red-100",
          ring: "ring-red-500/20",
        };
      case "warning":
        return {
          bg: "bg-gradient-to-r from-yellow-50 to-amber-50",
          border: "border-yellow-200",
          text: "text-yellow-800",
          progress: "bg-yellow-500",
          shadow: "shadow-yellow-100",
          ring: "ring-yellow-500/20",
        };
      case "info":
        return {
          bg: "bg-gradient-to-r from-blue-50 to-sky-50",
          border: "border-blue-200",
          text: "text-blue-800",
          progress: "bg-blue-500",
          shadow: "shadow-blue-100",
          ring: "ring-blue-500/20",
        };
      default:
        return {
          bg: "bg-gradient-to-r from-gray-50 to-slate-50",
          border: "border-gray-200",
          text: "text-gray-800",
          progress: "bg-gray-500",
          shadow: "shadow-gray-100",
          ring: "ring-gray-500/20",
        };
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full">
      {notifications.map((notification, index) => {
        const styles = getStyles(notification.type);

        return (
          <div
            key={notification.id}
            className={`
              transform transition-all duration-300 ease-out
              animate-in slide-in-from-right-full
              ${styles.bg} ${styles.border} ${styles.shadow}
              border rounded-xl shadow-lg backdrop-blur-sm
              ring-1 ${styles.ring}
              max-w-sm w-full
            `}
            style={{
              animationDelay: `${index * 100}ms`,
              animationFillMode: "both",
            }}
          >
            {/* Progress bar for auto-dismissing notifications */}
            {!notification.persistent && notification.duration && (
              <div className="h-1 bg-gray-200 rounded-t-xl overflow-hidden">
                <div
                  className={`h-full ${styles.progress} transition-all duration-100 ease-linear`}
                  style={{ width: `${progressBars[notification.id] || 100}%` }}
                />
              </div>
            )}

            <div className="p-4">
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {getIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {notification.title && (
                    <p className={`text-sm font-semibold ${styles.text} mb-1`}>
                      {notification.title}
                    </p>
                  )}
                  <p className={`text-sm ${styles.text} leading-relaxed`}>
                    {notification.message}
                  </p>

                  {/* Action button */}
                  {notification.action && (
                    <div className="mt-3">
                      <button
                        type="button"
                        className={`
                          inline-flex items-center px-3 py-1.5
                          text-xs font-medium rounded-lg
                          transition-all duration-200
                          ${styles.text} bg-white/50 hover:bg-white/80
                          focus:outline-none focus:ring-2 focus:ring-offset-2
                          ${styles.ring.replace("/20", "")}
                          border border-current/20
                        `}
                        onClick={notification.action.onClick}
                      >
                        {notification.action.label}
                      </button>
                    </div>
                  )}
                </div>

                {/* Close button */}
                <div className="flex-shrink-0">
                  <button
                    className={`
                      inline-flex items-center justify-center
                      w-6 h-6 rounded-lg
                      text-gray-400 hover:text-gray-600
                      hover:bg-white/50
                      transition-all duration-200
                      focus:outline-none focus:ring-2 focus:ring-offset-2
                      ${styles.ring.replace("/20", "")}
                    `}
                    onClick={() => removeNotification(notification.id)}
                    aria-label="Close notification"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
