import type { Notification } from "../../types/notification";
import { notificationStyles } from "../../styles/notificationStyles";
import { NotificationIcon, CloseIcon } from "./NotificationIcon";

interface NotificationItemProps {
  notification: Notification;
  progress: number;
  index: number;
  onClose: (id: string) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  progress,
  index,
  onClose,
}) => {
  const styles = notificationStyles;

  return (
    <div
      className={styles.toast(notification.type)}
      style={{
        animationDelay: `${index * 100}ms`,
        animationFillMode: "both",
      }}
    >
      {/* Progress Bar */}
      {!notification.persistent && notification.duration && (
        <div className="h-1 bg-gray-200 rounded-t-xl overflow-hidden">
          <div
            className={`h-full ${styles.progressBar(
              notification.type
            )} transition-all duration-100 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Notification Content */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">
            <NotificationIcon type={notification.type} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {notification.title && (
              <p
                className={`text-sm font-semibold ${styles.text(
                  notification.type
                )} mb-1`}
              >
                {notification.title}
              </p>
            )}
            <p
              className={`text-sm ${styles.text(
                notification.type
              )} leading-relaxed`}
            >
              {notification.message}
            </p>

            {/* Action Button */}
            {notification.action && (
              <div className="mt-3">
                <button
                  type="button"
                  className={styles.actionButton(notification.type)}
                  onClick={notification.action.onClick}
                >
                  {notification.action.label}
                </button>
              </div>
            )}
          </div>

          {/* Close Button */}
          <div className="flex-shrink-0">
            <button
              className={styles.closeButton(notification.type)}
              onClick={() => onClose(notification.id)}
              aria-label="Close notification"
            >
              <CloseIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
