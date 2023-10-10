import React, { useState, useContext, useCallback } from "react";
import { Toast, ToastContent } from "@salt-ds/core";
import "./notifications.css"
import classNames from "classnames"

const toastDisplayDuration = 3000;

export type ToastTypes = "warning" | "error" | "info" | "success"

type Notification = {
  type: ToastTypes,
  header: string,
  body: string
}

export const NotificationsContext = React.createContext<{
  notify: (notification: Notification) => void,
}>({
  notify: () => "this function was not implemented"
})

export const NotificationsProvider: any = (props: {
  children: JSX.Element | JSX.Element[]
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);


  const notify = useCallback((notification: Notification) => {
    setNotifications(prev => [...prev, notification])

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n !== notification))
    }, toastDisplayDuration)
  }, [],
  )

  return (
    <NotificationsContext.Provider value={{ notify }}>
      <div className="toast-container">
        {
          notifications.map(notification =>
            <Toast status={notification.type} className={classNames("toast", notification.type)}>
              <div className={classNames("toast-icon", `${notification.type}-icon`)} />
              <ToastContent className="toast-content">
                <div>
                  <strong>{notification.header}</strong>
                </div>
                <div>{notification.body}</div>
              </ToastContent>
            </Toast>)
        }
      </div>
      {props.children}
    </NotificationsContext.Provider>
  )
}

export const useNotifications = () => useContext(NotificationsContext);
