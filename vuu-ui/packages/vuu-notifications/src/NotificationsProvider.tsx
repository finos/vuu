import { getLocalEntity } from "@vuu-ui/vuu-utils";
import {
  type Context,
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";
import { NotificationsCenter } from "./NotificationsCenter";
import type {
  DispatchHideNotification,
  DispatchShowNotification,
  NotificationInterceptor,
  NotificationOrigin,
  NotificationsContextProps,
  ToastNotificationDescriptor,
} from "./NotificationsContext";

interface ToastWithExpiry extends ToastNotificationDescriptor {
  expires: number;
}

/**
 * Contexts are kept on the global object, so that every copy of this package
 * loaded into a page (e.g. by module federation remotes that don't share it)
 * resolves the same provider.
 */
const globalContext = <T,>(name: string, defaultValue: T): Context<T> => {
  const key = Symbol.for(name);
  const contexts = globalThis as unknown as Record<
    symbol,
    Context<T> | undefined
  >;
  let context = contexts[key];
  if (context === undefined) {
    context = createContext(defaultValue);
    contexts[key] = context;
  }
  return context;
};

/*
  The Context is not exposed outside this module, only the notify
  prop can be accessed via the useNotifications hook.
  The NotificationsCenter receives the full context object and
  sets the notify method. State management around dispatched
  notifications is handled entirely within the NotificationsCenter,
  avoiding rerendering our children when notifications are 
  dispatched.
*/
class NotificationsContextObject implements NotificationsContextProps {
  #showNotification: DispatchShowNotification = () => {
    console.log("have you forgotten to provide a NotificationsCenter?");
    return undefined;
  };
  #hideNotification: DispatchHideNotification = () =>
    console.log("have you forgotten to provide a NotificationsCenter?");
  interceptor: NotificationInterceptor | undefined = undefined;
  // We want the public notify method to be stable, setNotify call should not trigger re-renders
  showNotification: DispatchShowNotification = (notification) =>
    this.interceptor?.(notification) === "suppress"
      ? undefined
      : this.#showNotification(notification);
  hideNotification: DispatchHideNotification = (id) =>
    this.#hideNotification(id);
  setNotify = (
    showNotificationDispatcher: DispatchShowNotification,
    hideNotificationDispatcher: DispatchHideNotification,
  ) => {
    this.#showNotification = showNotificationDispatcher;
    this.#hideNotification = hideNotificationDispatcher;
  };
}

const NotificationsContext = globalContext<NotificationsContextObject | null>(
  "vuu.notifications.context",
  null,
);

const NotificationOriginContext = globalContext<NotificationOrigin | undefined>(
  "vuu.notifications.origin",
  undefined,
);

const noProvider = new NotificationsContextObject();

export interface NotificationsProviderProps {
  children?: ReactNode;
  /**
   * Sees every notification raised beneath the provider before it is shown.
   * Only used by the outermost provider.
   */
  interceptor?: NotificationInterceptor;
}

/**
 * Shows the notifications raised beneath it. Inside another
 * `NotificationsProvider` it renders only its children, so notifications
 * from nested applications are shown, once, by the outermost provider.
 */
export const NotificationsProvider = ({
  children,
  interceptor,
}: NotificationsProviderProps) => {
  const outerContext = useContext(NotificationsContext);
  return outerContext ? (
    children
  ) : (
    <OutermostNotificationsProvider interceptor={interceptor}>
      {children}
    </OutermostNotificationsProvider>
  );
};

const OutermostNotificationsProvider = ({
  children,
  interceptor,
}: NotificationsProviderProps) => {
  const [context] = useState(() => new NotificationsContextObject());
  context.interceptor = interceptor;
  const startupToastNotification = useMemo<
    ToastNotificationDescriptor | undefined
  >(() => {
    const toast = getLocalEntity<ToastWithExpiry>("startup-notification", true);
    if (toast && toast.expires >= +Date.now()) {
      const { expires: _expires, ...toastDescriptor } = toast;
      return toastDescriptor;
    }
  }, []);
  return (
    <NotificationsContext.Provider value={context}>
      <NotificationsCenter
        startupToastNotification={startupToastNotification}
        notificationsContext={context}
      />
      {children}
    </NotificationsContext.Provider>
  );
};

/**
 * Tags notifications raised beneath it with their origin. A nested provider
 * records the enclosing origin's module as its `parentModuleId`.
 */
export const NotificationOriginProvider = ({
  children,
  connectionId,
  moduleId,
}: {
  children?: ReactNode;
  connectionId?: string;
  moduleId?: string | number;
}) => {
  const outerOrigin = useContext(NotificationOriginContext);
  const outerModuleId = outerOrigin?.moduleId ?? outerOrigin?.parentModuleId;
  const parentModuleId =
    outerModuleId !== moduleId ? outerModuleId : outerOrigin?.parentModuleId;
  const origin = useMemo<NotificationOrigin>(
    () => ({ connectionId, moduleId, parentModuleId }),
    [connectionId, moduleId, parentModuleId],
  );
  return (
    <NotificationOriginContext.Provider value={origin}>
      {children}
    </NotificationOriginContext.Provider>
  );
};

export const useNotificationOrigin = () =>
  useContext(NotificationOriginContext);

export const useNotifications = () => {
  const context = useContext(NotificationsContext) ?? noProvider;
  const origin = useContext(NotificationOriginContext);
  return useMemo(
    () => ({
      hideNotification: context.hideNotification,
      showNotification: origin
        ? (((notification) =>
            context.showNotification(
              notification.origin ? notification : { ...notification, origin },
            )) satisfies DispatchShowNotification)
        : context.showNotification,
    }),
    [context, origin],
  );
};
