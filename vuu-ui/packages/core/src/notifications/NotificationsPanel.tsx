import {
  Button,
  Checkbox,
  Drawer,
  Dropdown,
  Input,
  Option,
  StatusIndicator,
  Switch,
  Text,
  ToggleButton,
  ToggleButtonGroup,
} from "@salt-ds/core";
import {
  CloseIcon,
  DeleteIcon,
  NotificationReadIcon,
  SearchIcon,
} from "@salt-ds/icons";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import {
  type KeyboardEvent,
  type SyntheticEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useInRouterContext, useNavigate } from "react-router-dom";
import { useOptionalIdentityContext } from "../auth/AuthenticationProvider";
import type {
  ModuleId,
  ModuleServerMap,
} from "../connection-management/ModuleServerMap";
import { isUnavailablePresence } from "../connection-management/server-status";
import { useOptionalApplicationState } from "../persistence/PersistenceContext";
import type { RemoteModuleDescriptor } from "../RemoteModuleDescriptor";
import {
  useModuleServerStatus,
  useVuuServerStatuses,
} from "../server-monitor/VuuServerMonitorProvider";
import type { PortalNotificationsAPI } from "./PortalNotificationsContext";
import { sourceLabel } from "./PortalNotificationsPresentation";
import {
  useNotificationList,
  useNotificationPresentation,
  usePortalNotifications,
} from "./PortalNotificationsProvider";
import type {
  NotificationKind,
  NotificationLevel,
  NotificationQuery,
  PortalNotification,
} from "./notification-types";

import notificationsPanelCss from "./NotificationsPanel.css";

const classBase = "vuuNotificationsPanel";

/** Entry in the portal's own saved state that holds the panel's filters. */
export const NOTIFICATIONS_PANEL_STATE_KEY = "notificationsPanel";

export interface NotificationsPanelFilters {
  /** Empty shows every application. */
  moduleIds: ModuleId[];
  /** Empty shows every level. */
  levels: NotificationLevel[];
  /** Empty shows every kind. */
  kinds: NotificationKind[];
  unreadOnly: boolean;
  showExpired: boolean;
  text: string;
}

const DEFAULT_FILTERS: NotificationsPanelFilters = {
  kinds: [],
  levels: [],
  moduleIds: [],
  showExpired: false,
  text: "",
  unreadOnly: false,
};

const LEVELS: NotificationLevel[] = ["error", "warning", "info", "success"];
const KINDS: NotificationKind[] = ["toast", "banner", "silent"];
const LEVEL_LABELS: Record<NotificationLevel, string> = {
  error: "Error",
  info: "Info",
  success: "Success",
  warning: "Warning",
};
const KIND_LABELS: Record<NotificationKind, string> = {
  banner: "Banner",
  silent: "Silent",
  toast: "Toast",
};

const isFilters = (value: unknown): value is NotificationsPanelFilters =>
  typeof value === "object" &&
  value !== null &&
  Array.isArray((value as NotificationsPanelFilters).levels);

const isFiltered = (filters: NotificationsPanelFilters) =>
  filters.moduleIds.length > 0 ||
  filters.levels.length > 0 ||
  filters.kinds.length > 0 ||
  filters.unreadOnly ||
  filters.showExpired ||
  filters.text !== "";

const toQuery = ({
  kinds,
  levels,
  moduleIds,
  showExpired,
  text,
  unreadOnly,
}: NotificationsPanelFilters): NotificationQuery => ({
  includeExpired: showExpired,
  kinds: kinds.length > 0 ? kinds : undefined,
  levels: levels.length > 0 ? levels : undefined,
  moduleIds: moduleIds.length > 0 ? moduleIds : undefined,
  read: unreadOnly ? false : undefined,
  text: text || undefined,
});

const formatTime = (time: number) =>
  new Date(time).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

const dayLabel = (time: number, now = Date.now()) => {
  const day = new Date(time).toDateString();
  if (day === new Date(now).toDateString()) {
    return "Today";
  }
  if (day === new Date(now - 86_400_000).toDateString()) {
    return "Yesterday";
  }
  return new Date(time).toLocaleDateString();
};

const groupByDay = (notifications: readonly PortalNotification[]) => {
  const groups: { label: string; notifications: PortalNotification[] }[] = [];
  for (const notification of notifications) {
    const label = dayLabel(notification.createdAt);
    const group = groups.at(-1);
    if (group?.label === label) {
      group.notifications.push(notification);
    } else {
      groups.push({ label, notifications: [notification] });
    }
  }
  return groups;
};

const navigationPath = (path: string) => path.replace(/\/?\*$/, "") || "/";

const notificationSource = (
  moduleServerMap: ModuleServerMap | undefined,
  { connectionId, moduleIds }: PortalNotification["origin"],
) =>
  sourceLabel(
    moduleServerMap,
    moduleIds,
    moduleIds.length === 0 ? "Portal" : (connectionId ?? "Portal"),
  );

/** Saves the panel's filters in the portal's own saved state. */
const usePanelFilters = () => {
  const portalState = useOptionalApplicationState();
  const [filters, setFilters] = useState<NotificationsPanelFilters>(() => {
    const saved: unknown = portalState?.get(NOTIFICATIONS_PANEL_STATE_KEY);
    return isFilters(saved)
      ? { ...DEFAULT_FILTERS, ...saved }
      : DEFAULT_FILTERS;
  });
  const update = (changes: Partial<NotificationsPanelFilters>) => {
    setFilters((current) => {
      const next = { ...current, ...changes };
      portalState?.set(
        NOTIFICATIONS_PANEL_STATE_KEY,
        next as unknown as Parameters<typeof portalState.set>[1],
        { label: "Notifications panel filters" },
      );
      return next;
    });
  };
  return [filters, update] as const;
};

const OpenModuleButton = ({
  module: { id, path, title },
  onOpen,
}: {
  module: RemoteModuleDescriptor;
  onOpen: () => void;
}) => {
  const navigate = useNavigate();
  const { presence } = useModuleServerStatus(id);
  return (
    <Button
      appearance="bordered"
      disabled={isUnavailablePresence(presence)}
      onClick={(event) => {
        event.stopPropagation();
        navigate(navigationPath(path));
        onOpen();
      }}
      sentiment="neutral"
    >
      Open {title}
    </Button>
  );
};

interface NotificationItemProps {
  api: PortalNotificationsAPI;
  canNavigate: boolean;
  expanded: boolean;
  moduleServerMap?: ModuleServerMap;
  notification: PortalNotification;
  onOpenModule: () => void;
  onSelect: (key: string) => void;
}

const NotificationItem = ({
  api,
  canNavigate,
  expanded,
  moduleServerMap,
  notification,
  onOpenModule,
  onSelect,
}: NotificationItemProps) => {
  const { createdAt, expired, key, level, message, origin, read, title } =
    notification;
  const module = moduleServerMap?.modules.find(
    ({ id }) => id === origin.moduleIds[0],
  );
  const toggleRead = () => api.markRead([key], !read);
  const remove = () => api.delete([key]);

  const handleKeyDown = (event: KeyboardEvent<HTMLLIElement>) => {
    if (event.target !== event.currentTarget) {
      return;
    }
    if (event.key === "Delete") {
      event.preventDefault();
      remove();
    } else if (event.key === "r" || event.key === "R") {
      event.preventDefault();
      toggleRead();
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(key);
    }
  };

  return (
    <li
      aria-expanded={expanded}
      className={cx(`${classBase}-item`, {
        [`${classBase}-item-unread`]: !read,
        [`${classBase}-item-expanded`]: expanded,
        [`${classBase}-item-expired`]: expired,
      })}
      data-notification-key={key}
      onClick={() => onSelect(key)}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <span aria-hidden className={`${classBase}-unreadDot`} />
      <StatusIndicator aria-hidden status={level} />
      <div className={`${classBase}-itemBody`}>
        <div className={`${classBase}-itemHeader`}>
          <Text className={`${classBase}-itemTitle`}>
            {read ? title : <strong>{title}</strong>}
            {expired ? " (expired)" : null}
          </Text>
          <Text className={`${classBase}-itemSource`} styleAs="label">
            {notificationSource(moduleServerMap, origin)} ·{" "}
            {formatTime(createdAt)}
          </Text>
        </div>
        {message ? (
          <Text className={`${classBase}-itemMessage`}>{message}</Text>
        ) : null}
        <div className={`${classBase}-itemActions`}>
          {canNavigate && module ? (
            <OpenModuleButton module={module} onOpen={onOpenModule} />
          ) : null}
          <span className={`${classBase}-itemActionsEnd`}>
            <Button
              appearance="transparent"
              aria-label={read ? "Mark unread" : "Mark read"}
              onClick={(event) => {
                event.stopPropagation();
                toggleRead();
              }}
              sentiment="neutral"
            >
              <NotificationReadIcon aria-hidden />
            </Button>
            <Button
              appearance="transparent"
              aria-label="Delete"
              onClick={(event) => {
                event.stopPropagation();
                remove();
              }}
              sentiment="neutral"
            >
              <DeleteIcon aria-hidden />
            </Button>
          </span>
        </div>
      </div>
    </li>
  );
};

const presenceLabel = (presence: string, since: number, now: number) => {
  if (presence === "online") {
    return "online";
  }
  if (isUnavailablePresence(presence as never) && since > 0) {
    const minutes = Math.max(1, Math.round((now - since) / 60_000));
    return `${presence} ${minutes}m`;
  }
  return presence;
};

/** Every server's availability, including servers no nav item shows. */
const ServerSummary = ({
  moduleServerMap,
}: {
  moduleServerMap?: ModuleServerMap;
}) => {
  const statuses = useVuuServerStatuses();
  if (statuses.size === 0) {
    return null;
  }
  const now = Date.now();
  return (
    <div className={`${classBase}-servers`}>
      <Text styleAs="label">Servers:</Text>
      {[...statuses.values()].map(({ connectionId, presence, since }) => (
        <span
          className={cx(
            `${classBase}-server`,
            `${classBase}-server-${presence}`,
          )}
          key={connectionId}
        >
          {connectionId === moduleServerMap?.portalConnectionId
            ? "Portal"
            : sourceLabel(
                moduleServerMap,
                moduleServerMap?.modulesFor(connectionId) ?? [],
                connectionId,
              )}{" "}
          <span className={`${classBase}-serverPresence`}>
            {presenceLabel(presence, since, now)}
          </span>
        </span>
      ))}
    </div>
  );
};

const NotificationsPanelContent = ({
  api,
}: {
  api: PortalNotificationsAPI;
}) => {
  const presentation = useNotificationPresentation();
  const moduleServerMap = useOptionalIdentityContext()?.moduleServerMap;
  const canNavigate = useInRouterContext();
  const [filters, setFilters] = usePanelFilters();
  const [selectedKey, setSelectedKey] = useState<string>();
  const listRef = useRef<HTMLDivElement>(null);
  const notifications = useNotificationList(toQuery(filters));
  const allNotifications = useNotificationList();
  const request = presentation?.panelRequest;

  // biome-ignore lint/correctness/useExhaustiveDependencies: apply each request once
  useEffect(() => {
    if (request?.moduleIds) {
      setFilters({ moduleIds: request.moduleIds });
    }
    if (request?.focusKey) {
      setSelectedKey(request.focusKey);
    }
  }, [request]);

  useEffect(() => {
    const focusKey = request?.focusKey;
    if (focusKey) {
      const item = listRef.current?.querySelector<HTMLElement>(
        `[data-notification-key="${CSS.escape(focusKey)}"]`,
      );
      item?.scrollIntoView?.({ block: "nearest" });
      item?.focus();
    }
  }, [request]);

  const moduleOptions = useMemo(() => {
    const ids = new Set<ModuleId>(filters.moduleIds);
    for (const { origin } of allNotifications) {
      for (const id of origin.moduleIds) {
        ids.add(id);
      }
    }
    return [...ids].map((id) => ({
      id,
      title: sourceLabel(moduleServerMap, [id], String(id)),
    }));
  }, [allNotifications, filters.moduleIds, moduleServerMap]);

  const moduleTitle = (id: ModuleId) =>
    moduleOptions.find((option) => option.id === id)?.title ?? String(id);

  const unreadKeys = notifications.filter((n) => !n.read).map((n) => n.key);
  const readKeys = notifications.filter((n) => n.read).map((n) => n.key);
  const close = () => presentation?.closePanel();
  const select = (key: string) => {
    setSelectedKey((current) => (current === key ? undefined : key));
    api.markRead([key]);
  };

  return (
    <div
      className={`${classBase}-content`}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          close();
        }
      }}
    >
      <div className={`${classBase}-header`}>
        <Text as="h2" className={`${classBase}-title`} styleAs="h3">
          Notifications
        </Text>
        <Button
          appearance="transparent"
          disabled={unreadKeys.length === 0}
          onClick={() => api.markRead(unreadKeys)}
          sentiment="neutral"
        >
          Mark all read
        </Button>
        <Button
          appearance="transparent"
          disabled={readKeys.length === 0}
          onClick={() => api.delete(readKeys)}
          sentiment="neutral"
        >
          Delete read
        </Button>
        <Button
          appearance="transparent"
          aria-label="Close notifications"
          onClick={close}
          sentiment="neutral"
        >
          <CloseIcon aria-hidden />
        </Button>
      </div>
      <div className={`${classBase}-filters`}>
        <Input
          bordered
          className={`${classBase}-search`}
          inputProps={{ "aria-label": "Search notifications" }}
          onChange={(event) =>
            setFilters({ text: (event.target as HTMLInputElement).value })
          }
          placeholder="Search…"
          startAdornment={<SearchIcon aria-hidden />}
          value={filters.text}
        />
        <Dropdown<ModuleId>
          aria-label="Applications"
          bordered
          multiselect
          onSelectionChange={(_: SyntheticEvent, moduleIds: ModuleId[]) =>
            setFilters({ moduleIds })
          }
          placeholder="All apps"
          selected={filters.moduleIds}
          value={filters.moduleIds.map(moduleTitle).join(", ")}
          valueToString={moduleTitle}
        >
          {moduleOptions.map(({ id, title }) => (
            <Option key={id} value={id}>
              {title}
            </Option>
          ))}
        </Dropdown>
        <Dropdown<NotificationLevel>
          aria-label="Levels"
          bordered
          multiselect
          onSelectionChange={(_: SyntheticEvent, levels: NotificationLevel[]) =>
            setFilters({ levels })
          }
          placeholder="All levels"
          selected={filters.levels}
          value={filters.levels.map((level) => LEVEL_LABELS[level]).join(", ")}
          valueToString={(level) => LEVEL_LABELS[level]}
        >
          {LEVELS.map((level) => (
            <Option key={level} value={level}>
              {LEVEL_LABELS[level]}
            </Option>
          ))}
        </Dropdown>
        <Dropdown<NotificationKind>
          aria-label="Types"
          bordered
          multiselect
          onSelectionChange={(_: SyntheticEvent, kinds: NotificationKind[]) =>
            setFilters({ kinds })
          }
          placeholder="All types"
          selected={filters.kinds}
          value={filters.kinds.map((kind) => KIND_LABELS[kind]).join(", ")}
          valueToString={(kind) => KIND_LABELS[kind]}
        >
          {KINDS.map((kind) => (
            <Option key={kind} value={kind}>
              {KIND_LABELS[kind]}
            </Option>
          ))}
        </Dropdown>
        <ToggleButtonGroup
          aria-label="Read state"
          onChange={(event) =>
            setFilters({
              unreadOnly: event.currentTarget.value === "unread",
            })
          }
          value={filters.unreadOnly ? "unread" : "all"}
        >
          <ToggleButton value="unread">Unread</ToggleButton>
          <ToggleButton value="all">All</ToggleButton>
        </ToggleButtonGroup>
        <Checkbox
          checked={filters.showExpired}
          label="Show expired"
          onChange={(event) =>
            setFilters({ showExpired: event.target.checked })
          }
        />
        {isFiltered(filters) ? (
          <Button
            appearance="transparent"
            onClick={() => setFilters(DEFAULT_FILTERS)}
            sentiment="accented"
          >
            Clear filters
          </Button>
        ) : null}
      </div>
      <div className={`${classBase}-list`} ref={listRef}>
        {notifications.length === 0 ? (
          <Text className={`${classBase}-empty`}>No notifications</Text>
        ) : (
          groupByDay(notifications).map(({ label, notifications }) => (
            <section aria-label={label} key={label}>
              <Text className={`${classBase}-day`} styleAs="label">
                {label}
              </Text>
              <ul>
                {notifications.map((notification) => (
                  <NotificationItem
                    api={api}
                    canNavigate={canNavigate}
                    expanded={selectedKey === notification.key}
                    key={notification.key}
                    moduleServerMap={moduleServerMap}
                    notification={notification}
                    onOpenModule={close}
                    onSelect={select}
                  />
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
      <div className={`${classBase}-footer`}>
        <ServerSummary moduleServerMap={moduleServerMap} />
        {presentation ? (
          <Switch
            checked={presentation.doNotDisturb}
            label="Do not disturb"
            onChange={(event) =>
              presentation.setDoNotDisturb(event.target.checked)
            }
          />
        ) : null}
      </div>
    </div>
  );
};

/**
 * Every notification the portal has received, with filters and actions, in
 * a drawer on the right. `PortalShell` renders it; open it with
 * `useNotificationPresentation().openPanel()`.
 */
export const NotificationsPanel = () => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-notifications-panel",
    css: notificationsPanelCss,
    window: targetWindow,
  });
  const api = usePortalNotifications();
  const presentation = useNotificationPresentation();
  if (!api || !presentation) {
    return null;
  }
  return (
    <Drawer
      aria-label="Notifications"
      className={classBase}
      disableDismiss
      disableScrim
      onOpenChange={(open) => {
        if (!open) {
          presentation.closePanel();
        }
      }}
      open={presentation.panelOpen}
      position="right"
    >
      <NotificationsPanelContent api={api} />
    </Drawer>
  );
};
