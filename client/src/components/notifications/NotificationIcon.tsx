import {
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import type { NotificationType } from "../../types/notification";

interface NotificationIconProps {
  type: NotificationType;
  className?: string;
}

export const NotificationIcon: React.FC<NotificationIconProps> = ({
  type,
  className = "w-6 h-6",
}) => {
  const iconProps = { className };

  switch (type) {
    case "success":
      return (
        <CheckCircleIcon
          {...iconProps}
          className={`${className} text-green-500`}
        />
      );
    case "error":
      return (
        <ExclamationCircleIcon
          {...iconProps}
          className={`${className} text-red-500`}
        />
      );
    case "warning":
      return (
        <ExclamationTriangleIcon
          {...iconProps}
          className={`${className} text-yellow-500`}
        />
      );
    case "info":
      return (
        <InformationCircleIcon
          {...iconProps}
          className={`${className} text-blue-500`}
        />
      );
    default:
      return null;
  }
};

export const CloseIcon: React.FC<{ className?: string }> = ({
  className = "w-4 h-4",
}) => <XMarkIcon className={className} />;
