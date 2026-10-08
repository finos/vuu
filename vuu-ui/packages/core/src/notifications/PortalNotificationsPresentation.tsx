import {
  isWorkspaceNotification,
  type Notification,
  type NotificationInterceptor,
  type ToastNotificationDescriptor,
  useNotifications,
} from "@vuu-ui/vuu-notifications";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  ModuleId,
  ModuleServerMap,
} from "../connection-management/ModuleServerMap";
import type { NotificationStore } from "./NotificationStore";
import type {
  NotificationsPanelRequest,
  PortalNotificationsPresentation,
} from "./PortalNotificationsContext";
import type {
  NotificationLevel,
  PortalNotification,
} from "./notification-types";
import {
  defaultPresentationPolicy,
  type PresentationContext,
  type PresentationPolicy,
  ToastRateLimiter,
} from "./presentation-policy";

let clientNotificationCount = 0;

const isRecordedByDefault = (level: NotificationLevel) =>
  level === "error" || level === "warning";

/** Titles of the modules using a server, for summary toasts and banners. */
export const sourceLabel = (
  moduleServerMap: ModuleServerMap | undefined,
  moduleIds: readonly ModuleId[],
  fallback: string,
) => {
  const titles = moduleIds
    .map((id) => moduleServerMap?.modules.find((m) => m.id === id)?.title)
    .filter((title): title is string => !!title);
  return titles.length > 0 ? titles.join(", ") : fallback;
};

interface PresentationState {
  /** Toasts shown by the portal itself, which the interceptor lets through. */
  portalToasts: WeakSet<Notification>;
  /** True while the interceptor records a client notification. */
  recordingClient: boolean;
}

export interface UsePortalPresentationProps {
  moduleServerMap?: ModuleServerMap;
  openModuleId?: ModuleId;
  policy?: PresentationPolicy;
  /** Undefined when notifications are disabled. */
  store?: NotificationStore;
}

/**
 * Applies the presentation policy: the interceptor records and filters
 * notifications raised through `useNotifications`, and the returned value
 * says how any portal notification is presented.
 */
export const usePortalPresentation = ({
  moduleServerMap,
  openModuleId,
  policy = defaultPresentationPolicy,
  store,
}: UsePortalPresentationProps) => {
  const [doNotDisturb, setDoNotDisturb] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelRequest, setPanelRequest] = useState<NotificationsPanelRequest>(
    {},
  );
  const [state] = useState<PresentationState>(() => ({
    portalToasts: new WeakSet(),
    recordingClient: false,
  }));

  const getContext = useCallback((): PresentationContext => {
    const resolution =
      openModuleId === undefined
        ? undefined
        : moduleServerMap?.get(openModuleId);
    return {
      activeConnectionId:
        resolution?.status === "resolved" ? resolution.connectionId : undefined,
      activeModuleId: openModuleId,
      doNotDisturb,
      documentVisible:
        typeof document === "undefined" ||
        document.visibilityState !== "hidden",
      panelOpen,
    };
  }, [doNotDisturb, moduleServerMap, openModuleId, panelOpen]);

  const presentationOf = useCallback(
    (notification: PortalNotification) => policy(notification, getContext()),
    [getContext, policy],
  );
  const presentationOfRef = useRef(presentationOf);
  presentationOfRef.current = presentationOf;

  const interceptor = useMemo<NotificationInterceptor | undefined>(
    () =>
      store
        ? (descriptor) => {
            if (
              isWorkspaceNotification(descriptor) ||
              state.portalToasts.has(descriptor)
            ) {
              return "present";
            }
            const { content, header, origin, record, status } = descriptor;
            const moduleId = origin?.moduleId ?? origin?.parentModuleId;
            clientNotificationCount += 1;
            const id = `toast-${clientNotificationCount}`;
            const now = Date.now();
            const notification: PortalNotification = {
              attributes: {},
              createdAt: now,
              expired: false,
              id,
              initial: false,
              key: `client:${moduleId ?? "portal"}:${id}`,
              kind: "toast",
              level: status,
              message: typeof content === "string" ? content : "",
              origin: {
                moduleIds: moduleId === undefined ? [] : [moduleId],
                source: "client",
              },
              read: false,
              receivedAt: now,
              title: header,
            };
            if (record ?? isRecordedByDefault(status)) {
              state.recordingClient = true;
              try {
                store.upsert(notification);
              } finally {
                state.recordingClient = false;
              }
            }
            return presentationOfRef.current(notification) === "none"
              ? "suppress"
              : "present";
          }
        : undefined,
    [state, store],
  );

  const presentation = useMemo<PortalNotificationsPresentation>(
    () => ({
      closePanel: () => setPanelOpen(false),
      doNotDisturb,
      openPanel: (request = {}) => {
        setPanelRequest(request);
        setPanelOpen(true);
      },
      panelOpen,
      panelRequest,
      presentationOf,
      setDoNotDisturb,
      setPanelOpen,
    }),
    [doNotDisturb, panelOpen, panelRequest, presentationOf],
  );

  return { interceptor, presentation, presentationOfRef, state };
};

const toToast = ({
  level,
  message,
  title,
}: PortalNotification): ToastNotificationDescriptor => ({
  content: message || undefined,
  header: title,
  status: level,
  type: "toast",
});

/**
 * Shows toasts for notifications added to the store by servers or
 * `publish()`, as the presentation policy decides.
 */
export const PortalToastPresenter = ({
  moduleServerMap,
  presentationOfRef,
  state,
  store,
}: {
  moduleServerMap?: ModuleServerMap;
  presentationOfRef: { current: (n: PortalNotification) => string };
  state: PresentationState;
  store: NotificationStore;
}) => {
  const { hideNotification, showNotification } = useNotifications();

  useEffect(() => {
    const show = (toast: ToastNotificationDescriptor) => {
      state.portalToasts.add(toast);
      return showNotification(toast);
    };
    const limiter = new ToastRateLimiter<PortalNotification>({
      hide: hideNotification,
      show: (notification) => show(toToast(notification)),
      showSummary: (source, count) => {
        const moduleIds = moduleServerMap?.modulesFor(source) ?? [];
        return show({
          header: `${count} more notification${count === 1 ? "" : "s"}`,
          content: `From ${sourceLabel(moduleServerMap, moduleIds, source)}`,
          status: "info",
          type: "toast",
        });
      },
    });
    const unsubscribe = store.subscribe((event) => {
      if (event.type !== "added" || state.recordingClient) {
        return;
      }
      const { notification } = event;
      if (presentationOfRef.current(notification) === "toast") {
        const { connectionId, moduleIds } = notification.origin;
        limiter.present(
          notification,
          connectionId ?? `client:${moduleIds.join(",")}`,
        );
      }
    });
    return () => {
      unsubscribe();
      limiter.dispose();
    };
  }, [
    hideNotification,
    moduleServerMap,
    presentationOfRef,
    showNotification,
    state,
    store,
  ]);

  return null;
};
