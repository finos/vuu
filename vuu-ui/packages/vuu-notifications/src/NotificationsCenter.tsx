import { getUniqueId, saveLocalEntity } from "@vuu-ui/vuu-utils";
import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  isToastNotification,
  isWorkspaceNotification,
  Notification,
  NotificationsContext,
  ToastNotificationDescriptor,
} from "./NotificationsContext";
import { ToastHoverHandler, ToastNotification } from "./ToastNotification";
import { WorkspaceNotification } from "./WorkspaceNotification";
import { MeasuredSize } from "@vuu-ui/vuu-ui-controls";

const ZeroSize: MeasuredSize = { height: 0, width: 0 };
const toastContainerRightPadding = 20;
const NO_NOTIFICATIONS: RuntimeToastNotification[] = [];
export interface NotificationsCenterProps {
  notificationsContext: NotificationsContext;
  startupToastNotification?: ToastNotificationDescriptor;
}

type TransitionStatus = "entry" | "exit";
interface RuntimeToastNotification extends ToastNotificationDescriptor {
  hidden: boolean;
  id: string;
  left: number;
  opacity?: number;
  size: MeasuredSize;
  transitionStatus?: TransitionStatus;
}

// animation times in milliseconds
const toastOffsetTop = 60;
const toastDisplayDuration = 6000;
const toastDisplayDurationPostHover = 2000;

const toastContainerContentGap = 10;
// rightPadding is used together with the toastWidth to compute the toast position
// at the beginning and at the end of the animation

export const NotificationsCenter = ({
  notificationsContext,
  startupToastNotification,
}: NotificationsCenterProps) => {
  const toastNotifications = useMemo<RuntimeToastNotification[]>(
    () =>
      startupToastNotification
        ? [
            {
              ...startupToastNotification,
              hidden: false,
              id: getUniqueId(),
              left: -1,
              size: ZeroSize,
            },
          ]
        : [],
    [startupToastNotification],
  );

  const [workspaceNotification, setWorkspaceNotification] =
    useState<ReactNode>(null);

  const hoveredToastRef = useRef<string | undefined>(undefined);
  const notificationsRef = useRef<RuntimeToastNotification[]>(NO_NOTIFICATIONS);
  const [notifications, _setNotifications] =
    useState<RuntimeToastNotification[]>(toastNotifications);

  const setNotifications = useCallback(
    (notifications: RuntimeToastNotification[]) => {
      _setNotifications((notificationsRef.current = notifications));
    },
    [],
  );

  const showNotification = useCallback(
    (notification: Notification) => {
      if (isToastNotification(notification)) {
        const { animationType = "none", renderPostRefresh } = notification;
        if (renderPostRefresh) {
          saveLocalEntity("startup-notification", {
            ...notification,
            expires: +new Date() + 10000,
          });
        } else {
          if (animationType.includes("slide-in")) {
            setNotifications(
              notificationsRef.current.concat({
                ...notification,
                hidden: true,
                id: getUniqueId(),
                left: -1,
                size: ZeroSize,
              }),
            );
          } else
            setNotifications(
              notificationsRef.current.concat({
                ...notification,
                hidden: false,
                id: getUniqueId(),
                left: -1,
                opacity: 0,
                size: ZeroSize,
              }),
            );
        }
      } else if (isWorkspaceNotification(notification)) {
        setWorkspaceNotification(
          <WorkspaceNotification>{notification.content}</WorkspaceNotification>,
        );
      } else {
        throw Error("[NotificationsCenter] invalid notification received");
      }
    },
    [setNotifications],
  );

  const hideNotification = useCallback(() => {
    setWorkspaceNotification(null);
  }, []);

  useMemo(() => {
    notificationsContext.setNotify(showNotification, hideNotification);
  }, [hideNotification, notificationsContext, showNotification]);

  const onMeasured = useCallback(
    (id: string, height: number, width: number) => {
      let scheduledUpdate: RuntimeToastNotification | undefined = undefined;
      const pageWidth = document.body.clientWidth;

      setNotifications(
        notificationsRef.current.map((n) => {
          if (n.id === id) {
            const slideIn = n.animationType?.includes("slide-in");
            const newToast: RuntimeToastNotification = {
              ...n,
              hidden: slideIn ? true : false,
              left: slideIn
                ? pageWidth + width - toastContainerRightPadding
                : pageWidth - width - toastContainerRightPadding,
              size: { height, width },
              transitionStatus: "entry",
            };

            if (slideIn) {
              scheduledUpdate = {
                ...newToast,
                hidden: false,
                left: pageWidth - width - toastContainerRightPadding,
              };
            } else {
              scheduledUpdate = {
                ...newToast,
                opacity: 1,
              };
            }

            return newToast;
          } else {
            return n;
          }
        }),
      );

      if (scheduledUpdate) {
        const updateNotifications = notificationsRef.current.map((n) => {
          if (n.id === scheduledUpdate?.id) {
            return scheduledUpdate;
          } else {
            return n;
          }
        });
        requestAnimationFrame(() => {
          setNotifications(updateNotifications);
        });
      }
    },
    [setNotifications],
  );

  useEffect(() => {
    // This handles both the entry transition and the exit transition
    document.body.addEventListener("transitionend", (e) => {
      const { classList, id } = e.target as HTMLElement;
      if (classList?.contains("vuuToastNotification")) {
        const notification = notificationsRef.current.find((n) => n.id === id);
        if (notification?.transitionStatus === "exit") {
          setNotifications(notificationsRef.current.filter((n) => n.id !== id));
        } else if (notification?.dismissal !== "manual") {
          setTimeout(() => {
            // In case notification has been manually cancelled ...
            if (notification && hoveredToastRef.current !== id) {
              const pageWidth = document.body.clientWidth;
              setNotifications(
                notificationsRef.current
                  .map((n) => {
                    if (n.id === id) {
                      if (n.animationType?.includes("slide-out")) {
                        return {
                          ...n,
                          transitionStatus: "exit" as TransitionStatus,
                          left: pageWidth + toastContainerRightPadding,
                        };
                      } else {
                        return {
                          ...n,
                          transitionStatus: "exit" as TransitionStatus,
                          opacity: 0,
                        };
                      }
                    } else {
                      return n;
                    }
                  })
                  .filter((v) => v !== null),
              );
            }
          }, toastDisplayDuration);
        }
      }
    });
  }, [setNotifications]);

  const handleDismiss = useCallback(
    (id?: string) => {
      if (id) {
        setNotifications(notificationsRef.current.filter((n) => n.id !== id));
      }
    },
    [setNotifications],
  );

  const handleHoverEntry = useCallback<ToastHoverHandler>((id) => {
    hoveredToastRef.current = id;
  }, []);

  const handleHoverExit = useCallback<ToastHoverHandler>(
    (id) => {
      hoveredToastRef.current = undefined;
      const notification = notificationsRef.current.find((n) => n.id === id);
      setTimeout(() => {
        // In case notification has been manually cancelled ...
        if (notification) {
          const pageWidth = document.body.clientWidth;
          setNotifications(
            notificationsRef.current
              .map((n) => {
                if (n.id === id) {
                  if (n.animationType?.includes("slide-out")) {
                    return {
                      ...n,
                      transitionStatus: "exit" as TransitionStatus,
                      left: pageWidth + toastContainerRightPadding,
                    };
                  } else {
                    return {
                      ...n,
                      transitionStatus: "exit" as TransitionStatus,
                      opacity: 0,
                    };
                  }
                } else {
                  return n;
                }
              })
              .filter((v) => v !== null),
          );
        }
      }, toastDisplayDurationPostHover);
    },
    [setNotifications],
  );

  return (
    <>
      {workspaceNotification}
      {notifications.map(
        ({ hidden, id, left = 0, opacity, size, ...toast }, i) => {
          const height = size ? size.height : 80;
          return (
            <ToastNotification
              hidden={hidden}
              id={id}
              key={id}
              left={left}
              notification={toast}
              onHoverEntry={handleHoverEntry}
              onHoverExit={handleHoverExit}
              onMeasured={onMeasured}
              onDismiss={handleDismiss}
              opacity={opacity}
              top={toastOffsetTop + (height + toastContainerContentGap) * i}
            />
          );
        },
      )}
    </>
  );
};
