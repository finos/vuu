import { Tooltip } from "@salt-ds/core";
import { useWindow } from "@salt-ds/window";
import { Icon } from "@vuu-ui/vuu-ui-controls";
import cx from "clsx";
import {
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  useId,
} from "react";
import { Link } from "react-router-dom";
import type { PortalNavItem } from "../portal-app-switcher/nav-section-utils";
import { circleQuestionMarkIcon } from "../portal-app-switcher/nav-item-utils";
import { useNavContextMenu } from "../portal-app-switcher/useNavContextMenu";
import {
  describeUnread,
  useNavItemPresence,
} from "../portal-app-switcher/useNavItemPresence";
import type { PortalNavDisplayMode, PortalNavProps } from "./portal-nav-types";
import {
  type PortalNavIndicator,
  usePortalNavIndicator,
} from "./usePortalNavIndicator";

const classBase = "vuuPortalNav";
const NO_MODULES: string[] = [];

export const describeIndicator = ({ count, severity }: PortalNavIndicator) =>
  severity === "unread"
    ? `${describeUnread(count)}.`
    : `${describeUnread(count)}, ${severity}.`;

/**
 * Notification dot. Decorative: the description, rendered hidden with
 * `descriptionId`, is for the owning control's `aria-describedby`.
 */
export const IndicatorDot = ({
  className,
  descriptionId,
  indicator,
}: {
  className?: string;
  descriptionId?: string;
  indicator?: PortalNavIndicator;
}) =>
  indicator ? (
    <>
      <span
        aria-hidden
        className={cx(
          `${classBase}-indicator`,
          `${classBase}-indicator-${indicator.severity}`,
          className,
        )}
        data-severity={indicator.severity}
      />
      {descriptionId ? (
        <span hidden id={descriptionId}>
          {describeIndicator(indicator)}
        </span>
      ) : null}
    </>
  ) : null;

/** `aria-describedby` from several optional ids. */
export const describedBy = (...ids: (string | false | undefined)[]) =>
  ids.filter(Boolean).join(" ") || undefined;

const NavIcon = ({
  item: { navIconName, navIconUrl },
  fallback,
}: {
  item: PortalNavItem;
  fallback: boolean;
}) => {
  const iconUrl =
    navIconUrl ??
    (navIconName || !fallback ? undefined : circleQuestionMarkIcon);
  if (!navIconName && !iconUrl) {
    return <span aria-hidden className={`${classBase}-iconPlaceholder`} />;
  }
  return (
    <Icon
      aria-hidden
      className={`${classBase}-itemIcon`}
      name={navIconName ?? "custom"}
      size={18}
      style={
        iconUrl
          ? ({ "--vuu-icon-svg": `url('${iconUrl}')` } as CSSProperties)
          : undefined
      }
    />
  );
};

const isCount = (badge: ReactNode): badge is number =>
  typeof badge === "number" && Number.isFinite(badge);

export interface PortalNavEntryProps {
  active: boolean;
  displayMode: Exclude<PortalNavDisplayMode, "minimized">;
  item: PortalNavItem;
  renderBadge?: (item: PortalNavItem) => ReactNode;
  /** Content nested under the item, in the expanded display modes. */
  renderChildren?: PortalNavProps["renderItemChildren"];
}

/** A module in the nav: a link with its icon, badge and notification dot. */
export const PortalNavEntry = ({
  active,
  displayMode,
  item,
  renderBadge,
  renderChildren,
}: PortalNavEntryProps) => {
  const targetWindow = useWindow();
  const rail = displayMode === "icons";
  const { anchorProps, badge, className, elements, unavailable } =
    useNavItemPresence({
      item,
      placement: "right",
      // The dot below replaces the unread count; this keeps the status badge.
      showNotificationBadge: false,
    });
  const contextMenu = useNavContextMenu({
    item,
    targetWindow,
    unavailable,
  });
  const indicator = usePortalNavIndicator(
    active || unavailable ? NO_MODULES : [item.moduleId],
  );
  const liveBadge = unavailable ? undefined : renderBadge?.(item);
  const hasBadge =
    liveBadge !== undefined && liveBadge !== null && liveBadge !== false;

  const onKeyDown = (event: KeyboardEvent<HTMLAnchorElement>) => {
    anchorProps.onKeyDown(event);
    contextMenu.onKeyDown?.(event);
  };

  const indicatorId = useId();
  const dot = <IndicatorDot indicator={indicator} />;

  return (
    <li className={`${classBase}-item`}>
      <Tooltip
        content={item.title}
        disabled={!rail}
        enterDelay={300}
        placement="right"
      >
        <Link
          {...anchorProps}
          aria-current={active ? "page" : undefined}
          aria-describedby={describedBy(
            anchorProps["aria-describedby"],
            indicator && indicatorId,
          )}
          className={cx(`${classBase}-link`, className, {
            [`${classBase}-link-active`]: active,
          })}
          data-portal-nav-focusable=""
          onContextMenu={contextMenu.onContextMenu}
          onKeyDown={onKeyDown}
          to={item.href}
        >
          {displayMode === "text" ? null : (
            <span className={cx(`${classBase}-icon`, "vuuNavItem-icon")}>
              <NavIcon fallback={rail} item={item} />
              {dot}
              {badge}
            </span>
          )}
          <span className={`${classBase}-label`}>{item.title}</span>
          {displayMode === "text" ? (
            <>
              {dot}
              {badge}
            </>
          ) : null}
          {!rail && hasBadge ? (
            <span className={`${classBase}-meta`}>
              {isCount(liveBadge) ? (
                <span className={`${classBase}-count`}>{liveBadge}</span>
              ) : (
                liveBadge
              )}
            </span>
          ) : null}
          {rail && !indicator && isCount(liveBadge) && liveBadge > 0 ? (
            <span
              aria-hidden
              className={`${classBase}-pip`}
              data-count={liveBadge}
            />
          ) : null}
        </Link>
      </Tooltip>
      {indicator ? (
        <span hidden id={indicatorId}>
          {describeIndicator(indicator)}
        </span>
      ) : null}
      {elements}
      {displayMode === "icons"
        ? null
        : renderChildren?.(item, { active, displayMode })}
    </li>
  );
};
