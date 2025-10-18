import { useState, useEffect } from "react";
import type { Notification } from "../types/notification";

export function useNotificationProgress(notifications: Notification[]) {
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
            delete intervals[notification.id];
          }
        }, 50);
      }
    });

    return () => {
      Object.values(intervals).forEach(clearInterval);
    };
  }, [notifications]);

  return progressBars;
}
