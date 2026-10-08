import { Badge, Button, StatusIndicator, useFloatingUI } from "@salt-ds/core";
import cx from "clsx";
import {
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ModuleId } from "../connection-management/ModuleServerMap";
import {
  isUnavailablePresence,
  type VuuServerStatus,
} from "../connection-management/server-status";
import {
  useModuleUnreadCount,
  useNotificationPresentation,
  useUnreadCount,
} from "../notifications/PortalNotificationsProvider";
import {
  useModuleServerStatusList,
  useNavItemVisibility,
  useRetryModule,
} from "../server-monitor/VuuServerMonitorProvider";
import type { NavItem } from "./PortalAppSwitcher";

const classBase = "vuuNavItemPresence";
const OPEN_DELAY_MS = 500;
const CLOSE_DELAY_MS = 150;
const RECOVERED_MS = 1500;

export interface UnavailableModule {
  moduleId: ModuleId;
  status: VuuServerStatus;
  title: string;
}

const formatTime = (epochMs: number) =>
  new Date(epochMs).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

const formatDuration = (ms: number) => {
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) {
    return "just now";
  }
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  return `${hours} h ${minutes % 60} min`;
};

export const describeUnavailable = ({ detail, since }: VuuServerStatus) => {
  const reason = detail?.reason ?? "Server unavailable";
  const sinceText = since ? ` since ${formatTime(since)}` : "";
  return `Unavailable: ${reason.toLowerCase()}${sinceText}.`;
};

export const describeUnread = (count: number) =>
  `${count} unread notification${count === 1 ? "" : "s"}`;

const EMPTY_IDS: ModuleId[] = [];

const leafModules = (item: NavItem): { moduleId: ModuleId; title: string }[] =>
  item.moduleId !== undefined
    ? [{ moduleId: item.moduleId, title: item.title }]
    : (item.children ?? []).flatMap((child) =>
        leafModules(child).map(({ moduleId, title }) => ({
          moduleId,
          title: `${item.title}: ${title}`,
        })),
      );

const UnavailableDetail = ({
  headlineId,
  module: { moduleId, status, title },
  onRetry,
  showUnread,
}: {
  headlineId?: string;
  module: UnavailableModule;
  onRetry: (moduleId: ModuleId) => void;
  showUnread: boolean;
}) => {
  const { detail, presence, since } = status;
  const unreadCount = useModuleUnreadCount(showUnread ? moduleId : undefined);
  const presentation = useNotificationPresentation();
  const now = Date.now();
  const unauthorized = presence === "unauthorized";
  const lastOnline =
    detail?.lastOnlineAt !== undefined
      ? ` · last online ${formatTime(detail.lastOnlineAt)}`
      : "";
  const retryText = unauthorized
    ? "Contact your administrator"
    : detail?.checking
      ? "Checking…"
      : detail?.reconnecting
        ? "Reconnecting automatically…"
        : detail?.nextAttemptAt !== undefined
          ? `Retrying automatically at ${formatTime(detail.nextAttemptAt)}`
          : undefined;

  return (
    <div className={`${classBase}-module`}>
      <div className={`${classBase}-headline`} id={headlineId}>
        <StatusIndicator
          aria-hidden
          status={unauthorized ? "error" : "warning"}
        />
        <span>{title} is unavailable</span>
      </div>
      <div className={`${classBase}-reason`}>
        {detail?.reason ?? "Server unavailable"}
      </div>
      {since ? (
        <div className={`${classBase}-since`}>
          {presence === "offline" ? "Offline" : "Unavailable"} since{" "}
          {formatTime(since)} ({formatDuration(now - since)}){lastOnline}
        </div>
      ) : null}
      {detail?.endpoint || detail?.error ? (
        <details className={`${classBase}-details`}>
          <summary>
            {detail.endpoint ? `Server: ${detail.endpoint}` : "Details"}
          </summary>
          {detail.error ?? "No further details"}
        </details>
      ) : null}
      {retryText ? (
        <div className={`${classBase}-retry`}>{retryText}</div>
      ) : null}
      {unreadCount > 0 ? (
        <div className={`${classBase}-unread`}>
          {describeUnread(unreadCount)}
        </div>
      ) : null}
      {unauthorized && !(presentation && unreadCount > 0) ? null : (
        <div className={`${classBase}-actions`}>
          {unauthorized ? null : (
            <Button
              disabled={detail?.checking}
              onClick={() => onRetry(moduleId)}
              sentiment="neutral"
            >
              Retry now
            </Button>
          )}
          {presentation && unreadCount > 0 ? (
            <Button
              appearance="bordered"
              onClick={() => presentation.openPanel({ moduleIds: [moduleId] })}
              sentiment="neutral"
            >
              Show notifications
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
};

export interface NavItemPresenceProps {
  enabled?: boolean;
  item: NavItem;
  placement?: "bottom" | "right";
  /**
   * Show the unread notifications badge. A group shows the total for its
   * available children, so turn it off while the group is expanded.
   */
  showNotificationBadge?: boolean;
}

export interface NavItemPresence {
  /** Props to spread on the nav item's focusable anchor. */
  anchorProps: {
    "aria-describedby"?: string;
    "aria-disabled"?: true;
    onBlur: (event: FocusEvent<HTMLElement>) => void;
    onClick: (event: MouseEvent<HTMLElement>) => void;
    onFocus: (event: FocusEvent<HTMLElement>) => void;
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    ref: (element: HTMLElement | null) => void;
  };
  /** Classname for the item, greyed when unavailable. */
  className?: string;
  /**
   * The unread notifications badge, or a status badge in its place while
   * unavailable.
   */
  badge: ReactNode;
  /** The description and overlay, to render after the anchor. */
  elements: ReactNode;
  unavailable: boolean;
  unreadCount: number;
}

/**
 * Presence decoration for a nav item. An item whose server is offline,
 * denied or whose config failed is greyed and can't be opened; hovering or
 * focusing it shows why, with a Retry now action. A group is unavailable
 * only when all its children are.
 */
export const useNavItemPresence = ({
  enabled = true,
  item,
  placement = "right",
  showNotificationBadge = true,
}: NavItemPresenceProps): NavItemPresence => {
  const modules = useMemo(() => leafModules(item), [item]);
  const moduleIds = useMemo(
    () => modules.map(({ moduleId }) => moduleId),
    [modules],
  );
  const statuses = useModuleServerStatusList(enabled ? moduleIds : []);
  const retry = useRetryModule();
  const isGroup = item.moduleId === undefined;

  const unavailableModules = useMemo<UnavailableModule[]>(
    () =>
      statuses.flatMap((status, i) =>
        isUnavailablePresence(status.presence)
          ? [{ ...modules[i], status }]
          : [],
      ),
    [modules, statuses],
  );
  const unavailable =
    enabled &&
    modules.length > 0 &&
    unavailableModules.length === modules.length;

  const availableModuleIds = useMemo(() => {
    if (unavailableModules.length === 0) {
      return moduleIds;
    }
    const unavailableIds = new Set(
      unavailableModules.map(({ moduleId }) => moduleId),
    );
    return moduleIds.filter((id) => !unavailableIds.has(id));
  }, [moduleIds, unavailableModules]);
  const unreadCount = useUnreadCount({
    moduleIds: showNotificationBadge ? availableModuleIds : EMPTY_IDS,
  });

  const [open, setOpen] = useState(false);
  const [recovered, setRecovered] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const elementRef = useRef<HTMLElement | null>(null);
  const floatingRef = useRef<HTMLElement | null>(null);
  const hadUnavailable = useRef(false);
  const restoringFocus = useRef(false);

  useNavItemVisibility(item.moduleId, elementRef);

  const { context, refs, strategy, x, y } = useFloatingUI({
    open,
    placement,
    strategy: "fixed",
  });

  const clearTimer = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = undefined;
    }
  }, []);
  useEffect(() => clearTimer, [clearTimer]);

  // While open, show "Available again" briefly when everything recovers.
  useEffect(() => {
    if (unavailableModules.length > 0) {
      hadUnavailable.current = true;
      setRecovered(false);
    } else if (open && hadUnavailable.current) {
      hadUnavailable.current = false;
      setRecovered(true);
      clearTimer();
      timer.current = setTimeout(() => {
        setOpen(false);
        setRecovered(false);
      }, RECOVERED_MS);
    } else if (!open) {
      hadUnavailable.current = false;
    }
  }, [clearTimer, open, unavailableModules.length]);

  const showOverlay = enabled && (unavailableModules.length > 0 || recovered);

  const scheduleOpen = (delay: number) => {
    clearTimer();
    if (showOverlay) {
      timer.current = setTimeout(() => setOpen(true), delay);
    }
  };
  const scheduleClose = () => {
    clearTimer();
    timer.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  };

  const isWithin = (target: EventTarget | null) =>
    target instanceof Node &&
    (elementRef.current?.contains(target) ||
      floatingRef.current?.contains(target));

  const ref = useCallback(
    (element: HTMLElement | null) => {
      elementRef.current = element;
      refs.setReference(element);
    },
    [refs],
  );
  const setFloating = useCallback(
    (element: HTMLDivElement | null) => {
      floatingRef.current = element;
      refs.setFloating(element);
    },
    [refs],
  );

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape" && open) {
      event.stopPropagation();
      clearTimer();
      setOpen(false);
      // Return focus to the item without reopening the overlay.
      restoringFocus.current = true;
      elementRef.current?.focus();
      restoringFocus.current = false;
    }
  };
  const onBlur = (event: FocusEvent<HTMLElement>) => {
    if (!isWithin(event.relatedTarget)) {
      scheduleClose();
    }
  };

  const descriptionId = useId();
  const headlineId = useId();
  const description = [
    unavailable ? describeUnavailable(unavailableModules[0].status) : "",
    unreadCount > 0 ? `${describeUnread(unreadCount)}.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const anchorProps: NavItemPresence["anchorProps"] = {
    "aria-describedby": description ? descriptionId : undefined,
    "aria-disabled": unavailable && !isGroup ? true : undefined,
    onBlur,
    onClick: (event) => {
      if (unavailable && !isGroup) {
        // Not navigable: pin the overlay open and retry.
        event.preventDefault();
        clearTimer();
        setOpen(true);
        moduleIds.forEach(retry);
      }
    },
    onFocus: (event) => {
      if (isWithin(event.relatedTarget)) {
        // Focus moved back from the overlay; keep it open.
        clearTimer();
      } else if (
        !restoringFocus.current &&
        event.currentTarget.matches(":focus-visible")
      ) {
        scheduleOpen(0);
      }
    },
    onKeyDown,
    onMouseEnter: () => scheduleOpen(OPEN_DELAY_MS),
    onMouseLeave: scheduleClose,
    ref,
  };

  const badge = unavailable ? (
    <span aria-hidden className={`${classBase}-statusBadge`}>
      <StatusIndicator
        status={
          unavailableModules.every(
            ({ status }) => status.presence === "unauthorized",
          )
            ? "error"
            : "warning"
        }
      />
    </span>
  ) : unreadCount > 0 ? (
    <span aria-hidden className={`${classBase}-unreadBadge`}>
      <Badge max={99} value={unreadCount} />
    </span>
  ) : null;

  const elements = (
    <>
      {description ? (
        <span className={`${classBase}-description`} hidden id={descriptionId}>
          {description}
        </span>
      ) : null}
      {open && showOverlay ? (
        <div
          aria-labelledby={recovered ? undefined : headlineId}
          aria-label={
            recovered ? `${item.title} is available again` : undefined
          }
          className={cx(`${classBase}-overlay`, {
            [`${classBase}-overlay-recovered`]: recovered,
          })}
          data-placement={context.placement}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          onMouseEnter={clearTimer}
          onMouseLeave={scheduleClose}
          ref={setFloating}
          role="dialog"
          style={{ left: x ?? 0, position: strategy, top: y ?? 0 }}
        >
          {recovered ? (
            <div className={`${classBase}-headline`}>
              <StatusIndicator aria-hidden status="success" />
              <span>Available again</span>
            </div>
          ) : (
            unavailableModules.map((module, i) => (
              <UnavailableDetail
                headlineId={i === 0 ? headlineId : undefined}
                key={module.moduleId}
                module={module}
                onRetry={retry}
                showUnread={showNotificationBadge}
              />
            ))
          )}
        </div>
      ) : null}
    </>
  );

  return {
    anchorProps,
    badge,
    className: unavailable ? "vuuNavItem-unavailable" : undefined,
    elements,
    unavailable,
    unreadCount,
  };
};
