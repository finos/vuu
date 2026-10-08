import { Badge, Button, StatusIndicator } from "@salt-ds/core";
import { NotificationIcon } from "@salt-ds/icons";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { type HTMLAttributes, useEffect, useRef, useState } from "react";
import { useOptionalIdentityContext } from "../auth/AuthenticationProvider";
import { sourceLabel } from "./PortalNotificationsPresentation";
import {
  useLatestNotification,
  useNotificationPresentation,
  usePortalNotifications,
  useUnreadCount,
} from "./PortalNotificationsProvider";
import type { PortalNotification } from "./notification-types";

import notificationsIndicatorCss from "./NotificationsIndicator.css";

const classBase = "vuuNotificationsIndicator";

export interface NotificationsIndicatorProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * `bell-and-latest` also shows the latest notification next to the bell
   * for `tickerDurationMs` after it arrives. Default `bell-and-latest`.
   */
  compactStyle?: "bell" | "bell-and-latest";
  /** Default 10000. */
  tickerDurationMs?: number;
}

const formatAge = (time: number, now: number) => {
  const minutes = Math.floor((now - time) / 60_000);
  return minutes < 1 ? "now" : `${minutes}m`;
};

/**
 * The bell in the portal header: the unread count, the latest notification
 * as it arrives, and a button to open the notifications panel. Renders
 * nothing when notifications are disabled.
 */
export const NotificationsIndicator = ({
  className,
  compactStyle = "bell-and-latest",
  tickerDurationMs = 10_000,
  ...htmlAttributes
}: NotificationsIndicatorProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-notifications-indicator",
    css: notificationsIndicatorCss,
    window: targetWindow,
  });

  const api = usePortalNotifications();
  const presentation = useNotificationPresentation();
  const moduleServerMap = useOptionalIdentityContext()?.moduleServerMap;
  const unreadCount = useUnreadCount();
  const latest = useLatestNotification();
  const [ticker, setTicker] = useState<PortalNotification>();
  const [announcement, setAnnouncement] = useState("");
  const lastKey = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!latest || latest.key === lastKey.current) {
      return;
    }
    const isFirst = lastKey.current === undefined && latest.initial;
    lastKey.current = latest.key;
    if (isFirst || latest.initial || latest.read || latest.expired) {
      return;
    }
    const source = sourceLabel(
      moduleServerMap,
      latest.origin.moduleIds,
      "Portal",
    );
    setAnnouncement(`New ${latest.level} from ${source}: ${latest.title}`);
    if (compactStyle === "bell-and-latest") {
      setTicker(latest);
      const timer = setTimeout(() => setTicker(undefined), tickerDurationMs);
      return () => clearTimeout(timer);
    }
  }, [compactStyle, latest, moduleServerMap, tickerDurationMs]);

  if (!api || !presentation) {
    return null;
  }

  const togglePanel = () =>
    presentation.panelOpen
      ? presentation.closePanel()
      : presentation.openPanel();

  return (
    <div className={cx(classBase, className)} {...htmlAttributes}>
      {ticker && !ticker.read ? (
        <Button
          appearance="transparent"
          className={`${classBase}-ticker`}
          onClick={() => presentation.openPanel({ focusKey: ticker.key })}
          sentiment="neutral"
        >
          <StatusIndicator aria-hidden status={ticker.level} />
          <span className={`${classBase}-tickerTitle`}>{ticker.title}</span>
          {ticker.message ? (
            <span className={`${classBase}-tickerMessage`}>
              {ticker.message}
            </span>
          ) : null}
          <span className={`${classBase}-tickerAge`}>
            {formatAge(ticker.createdAt, Date.now())}
          </span>
        </Button>
      ) : null}
      <Button
        appearance="transparent"
        aria-expanded={presentation.panelOpen}
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        className={`${classBase}-bell`}
        onClick={togglePanel}
        sentiment="neutral"
      >
        {unreadCount > 0 ? (
          <Badge max={99} value={unreadCount}>
            <NotificationIcon aria-hidden />
          </Badge>
        ) : (
          <NotificationIcon aria-hidden />
        )}
      </Button>
      <span aria-live="polite" className={`${classBase}-announcer`}>
        {announcement}
      </span>
    </div>
  );
};
