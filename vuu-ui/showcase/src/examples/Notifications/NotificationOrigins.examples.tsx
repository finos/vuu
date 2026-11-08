import {
  isToastNotification,
  type Notification,
  type NotificationInterceptor,
  NotificationOriginProvider,
  NotificationsProvider,
  useNotifications,
} from "@vuu-ui/vuu-notifications";
import { useCallback, useState } from "react";

const RaiseButton = ({
  label = "Raise",
  notification,
}: {
  label?: string;
  notification?: Partial<Notification>;
}) => {
  const { showNotification } = useNotifications();
  return (
    <button
      onClick={() =>
        showNotification({
          header: label,
          status: "info",
          type: "toast",
          ...notification,
        } as Notification)
      }
      type="button"
    >
      {label}
    </button>
  );
};

/** Lists the notifications an interceptor has seen, and their origins. */
const useInterceptorLog = (decision: "present" | "suppress") => {
  const [seen, setSeen] = useState<Notification[]>([]);
  const interceptor = useCallback<NotificationInterceptor>(
    (notification) => {
      setSeen((current) => [...current, notification]);
      return decision;
    },
    [decision],
  );
  const log = (
    <ol aria-label="Intercepted">
      {seen.map((notification, i) => (
        <li key={i}>
          {isToastNotification(notification) ? notification.header : ""}{" "}
          {JSON.stringify(notification.origin ?? null)}
        </li>
      ))}
    </ol>
  );
  return { interceptor, log };
};

/**
 * The inner provider would suppress everything, but only the outermost
 * provider shows notifications, so the toast appears once.
 */
export const NestedProviders = () => {
  const { interceptor, log } = useInterceptorLog("present");
  return (
    <NotificationsProvider interceptor={interceptor}>
      <NotificationsProvider interceptor={() => "suppress"}>
        <RaiseButton />
      </NotificationsProvider>
      {log}
    </NotificationsProvider>
  );
};

/** The interceptor suppresses every notification, so no toast appears. */
export const SuppressedNotifications = () => {
  const { interceptor, log } = useInterceptorLog("suppress");
  return (
    <NotificationsProvider interceptor={interceptor}>
      <RaiseButton />
      {log}
    </NotificationsProvider>
  );
};

/**
 * Notifications are tagged with the nearest origin. The nested origin
 * records the outer module as its parent; an origin the caller sets is kept.
 */
export const NotificationOrigins = () => {
  const { interceptor, log } = useInterceptorLog("suppress");
  return (
    <NotificationsProvider interceptor={interceptor}>
      <NotificationOriginProvider connectionId="simul" moduleId="host">
        <RaiseButton label="Host" />
        <RaiseButton
          label="Explicit"
          notification={{ origin: { moduleId: "x" } }}
        />
        <NotificationOriginProvider connectionId="risk" moduleId="viewer">
          <RaiseButton label="Viewer" />
        </NotificationOriginProvider>
      </NotificationOriginProvider>
      <RaiseButton label="No origin" />
      {log}
    </NotificationsProvider>
  );
};
