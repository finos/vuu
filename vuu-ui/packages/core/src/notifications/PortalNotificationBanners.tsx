import {
  Banner,
  BannerActions,
  BannerContent,
  Button,
  Text,
} from "@salt-ds/core";
import { CloseIcon } from "@salt-ds/icons";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { useMemo, useState } from "react";
import { useOptionalIdentityContext } from "../auth/AuthenticationProvider";
import { sourceLabel } from "./PortalNotificationsPresentation";
import {
  useNotificationList,
  useNotificationPresentation,
  usePortalNotifications,
} from "./PortalNotificationsProvider";

import portalNotificationBannersCss from "./PortalNotificationBanners.css";

const classBase = "vuuPortalNotificationBanners";
const MAX_VISIBLE = 2;
const BANNER_QUERY = {
  includeExpired: false,
  kinds: ["banner" as const],
  read: false,
};

/**
 * Unread banner notifications, from any application, shown until the user
 * closes them. Rendered by `PortalShell` above the content area.
 */
export const PortalNotificationBanners = () => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-portal-notification-banners",
    css: portalNotificationBannersCss,
    window: targetWindow,
  });

  const moduleServerMap = useOptionalIdentityContext()?.moduleServerMap;
  const api = usePortalNotifications();
  const presentation = useNotificationPresentation();
  const notifications = useNotificationList(BANNER_QUERY);
  const [expanded, setExpanded] = useState(false);

  const banners = useMemo(
    () =>
      presentation
        ? notifications.filter(
            (notification) =>
              presentation.presentationOf(notification) === "banner",
          )
        : [],
    [notifications, presentation],
  );

  if (!api || banners.length === 0) {
    return null;
  }

  const visible = expanded ? banners : banners.slice(0, MAX_VISIBLE);
  const hidden = banners.length - visible.length;

  return (
    <div className={classBase} role="region" aria-label="Notifications">
      {visible.map(({ key, level, message, origin, title }) => (
        <Banner key={key} status={level} data-notification-key={key}>
          <BannerContent>
            <Text className={`${classBase}-source`} styleAs="label">
              {sourceLabel(
                moduleServerMap,
                origin.moduleIds,
                origin.connectionId ?? "Portal",
              )}
            </Text>
            <Text>
              <strong>{title}</strong>
              {message ? ` ${message}` : null}
            </Text>
          </BannerContent>
          <BannerActions>
            <Button
              appearance="transparent"
              aria-label="Close"
              onClick={() => api.markRead([key])}
              sentiment="neutral"
            >
              <CloseIcon aria-hidden />
            </Button>
          </BannerActions>
        </Banner>
      ))}
      {hidden > 0 || expanded ? (
        <Button
          appearance="transparent"
          className={`${classBase}-more`}
          onClick={() => setExpanded(!expanded)}
          sentiment="neutral"
        >
          {expanded ? "Show fewer" : `+${hidden} more`}
        </Button>
      ) : null}
    </div>
  );
};
