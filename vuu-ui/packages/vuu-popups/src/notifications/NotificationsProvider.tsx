import React, { useState, useContext, useCallback, useEffect } from "react";
import classNames from "classnames"
import { getUniqueId } from "@finos/vuu-utils";

import "./notifications.css"

// animation times in milliseconds
const toastDisplayDuration = 3000;
const exitAnimationDuration = 1000;
const verticalTransitionTime = 300

const toastHeight = 56;
const toastWidth = 300;
const rightGap = 50;
const topGap = 10;
const leftGap = 10;

const classBase = "vuuToastNotifications";

export type ToastTypes = "warning" | "error" | "info" | "success"

type Notification = {
  type: ToastTypes,
  header: string,
  body: string,
  id: string
}

export const NotificationsContext = React.createContext<{
  notify: (notification: Omit<Notification, "id">) => void,
}>({
  notify: () => "have you forgotten to provide a NotificationProvider?"
})

export const NotificationsProvider = (props: {
  children: JSX.Element | JSX.Element[]
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notify = useCallback((notification: Omit<Notification, "id">) => {
    const newNotification = { ...notification, id: getUniqueId() }

    setNotifications(prev => [...prev, newNotification])

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n !== newNotification))
    }, toastDisplayDuration + exitAnimationDuration * 2)
  }, [],
  )

  return (
    <NotificationsContext.Provider value={{ notify }}>
      <div
        className={`${classBase}-toastContainer`}
        style={{ width: toastWidth + rightGap + leftGap }}
      >
        {
          notifications.map((notification, i) =>
            <ToastNotification
              top={(toastHeight + topGap) * i}
              notification={notification}
              key={notification.id}
            />
          )
        }
      </div>
      {props.children}
    </NotificationsContext.Provider>
  )
}

export const useNotifications = () => useContext(NotificationsContext);

type ToastNotificationProps = {
  top: number,
  notification: Notification,
  animated?: boolean
}

// Only exported for use in individual toast examples. Normal usage will be through the provider
export const ToastNotification = (props: ToastNotificationProps) => {

  const {
    top,
    notification,
    animated = true
  } = props;

  const [right, setRight] = useState(-toastWidth - rightGap)

  useEffect(() => {
    setRight(rightGap)
    if (animated) {
      setTimeout(() => setRight(-toastWidth - rightGap), toastDisplayDuration + exitAnimationDuration)
    }
  }, [animated])

  return (
    <div
      className={classNames(`${classBase}-toast`, notification.type)}
      style={{
        height: toastHeight,
        right,
        width: toastWidth,
        top,
        transition: animated ? `right ${exitAnimationDuration / 1000}s, top ${verticalTransitionTime / 1000}s ` : 'none'
      }}
    >
      <div className={classNames(`${classBase}-toastIcon`, `${notification.type}-icon`)} />
      <div className={`${classBase}-toastContent`}>
        <strong className={`${classBase}-toastHeader`}>{notification.header}</strong>
        <div>{notification.body}</div>
      </div>
    </div>
  )
}
