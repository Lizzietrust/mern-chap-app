import type {
  NotificationState,
  NotificationActionType,
} from "../../types/notification";

export const initialState: NotificationState = {
  notifications: [],
};

export function notificationReducer(
  state: NotificationState,
  action: NotificationActionType
): NotificationState {
  switch (action.type) {
    case "ADD_NOTIFICATION":
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
      };

    case "REMOVE_NOTIFICATION":
      return {
        ...state,
        notifications: state.notifications.filter(
          (notification) => notification.id !== action.payload
        ),
      };

    case "CLEAR_ALL":
      return {
        ...state,
        notifications: [],
      };

    default:
      return state;
  }
}
