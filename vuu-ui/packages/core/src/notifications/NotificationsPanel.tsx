import {
  Button,
  Checkbox,
  Drawer,
  Dropdown,
  Input,
  Menu,
  MenuItem,
  MenuPanel,
  MenuTrigger,
  Option,
  Overlay,
  OverlayPanel,
  OverlayPanelContent,
  OverlayTrigger,
  Pill,
  PillGroup,
  StatusIndicator,
  Switch,
  Text,
  ToggleButton,
  ToggleButtonGroup,
} from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { Icon } from "@vuu-ui/vuu-ui-controls";
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
import {
  isRoutedModule,
  type RemoteModuleDescriptor,
} from "../RemoteModuleDescriptor";
import { useModuleServerStatus } from "../server-monitor/VuuServerMonitorProvider";
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
  /** Expired notifications are shown, dimmed, unless this is set. */
  hideExpired: boolean;
  text: string;
}

const DEFAULT_FILTERS: NotificationsPanelFilters = {
  hideExpired: false,
  kinds: [],
  levels: [],
  moduleIds: [],
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
  filters.hideExpired ||
  filters.text !== "";

const toQuery = ({
  hideExpired,
  kinds,
  levels,
  moduleIds,
  text,
  unreadOnly,
}: NotificationsPanelFilters): NotificationQuery => ({
  includeExpired: !hideExpired,
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

const formatSeconds = (time: number) =>
  new Date(time).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

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

/** Extra columns the server sent, as name and value. */
const attributeEntries = ({ attributes }: PortalNotification) =>
  Object.entries(attributes)
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    )
    .map(([name, value]) => [name, String(value)] as const);

/** Type, server, received and expiry, for the expanded row. */
const deliveryLine = ({
  expired,
  expiresAt,
  kind,
  origin,
  receivedAt,
}: PortalNotification) =>
  [
    KIND_LABELS[kind],
    origin.connectionId,
    `received ${formatSeconds(receivedAt)}`,
    expiresAt === undefined
      ? undefined
      : `${expired ? "expired" : "expires"} ${formatSeconds(expiresAt)}`,
  ]
    .filter(Boolean)
    .join(" · ");

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
  module: RemoteModuleDescriptor & { path: string };
  onOpen: () => void;
}) => {
  const navigate = useNavigate();
  const { presence } = useModuleServerStatus(id);
  return (
    <Button
      appearance="solid"
      disabled={isUnavailablePresence(presence)}
      onClick={(event) => {
        event.stopPropagation();
        navigate(navigationPath(path));
        onOpen();
      }}
      sentiment="accented"
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
  const attributes = expanded ? attributeEntries(notification) : [];
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
      <StatusIndicator
        aria-label={LEVEL_LABELS[level]}
        className={`${classBase}-level`}
        status={level}
      />
      <div className={`${classBase}-itemBody`}>
        <div className={`${classBase}-itemHeader`}>
          <span className={`${classBase}-itemTitle`}>{title}</span>
          <span className={`${classBase}-itemSource`}>
            {notificationSource(moduleServerMap, origin)}
          </span>
          {expired ? (
            <span className={`${classBase}-expiredTag`}>Expired</span>
          ) : null}
          <time
            className={`${classBase}-itemTime`}
            dateTime={new Date(createdAt).toISOString()}
          >
            {formatTime(createdAt)}
          </time>
        </div>
        {message ? (
          <div className={`${classBase}-itemMessage`}>{message}</div>
        ) : null}
        {expanded ? (
          <>
            {attributes.length > 0 ? (
              <dl className={`${classBase}-attributes`}>
                {attributes.map(([name, value]) => (
                  <div className={`${classBase}-attribute`} key={name}>
                    <dt>{name}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            <div className={`${classBase}-itemActions`}>
              {canNavigate && module && isRoutedModule(module) ? (
                <OpenModuleButton module={module} onOpen={onOpenModule} />
              ) : null}
              <span className={`${classBase}-itemActionsEnd`}>
                <Button
                  appearance="transparent"
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleRead();
                  }}
                  sentiment="neutral"
                >
                  {read ? "Mark unread" : "Mark read"}
                </Button>
                <Button
                  appearance="transparent"
                  onClick={(event) => {
                    event.stopPropagation();
                    remove();
                  }}
                  sentiment="neutral"
                >
                  Delete
                </Button>
              </span>
            </div>
            <div className={`${classBase}-delivery`}>
              {deliveryLine(notification)} · R read · Del delete
            </div>
          </>
        ) : null}
      </div>
    </li>
  );
};

interface MoreFiltersProps {
  filters: NotificationsPanelFilters;
  moduleOptions: { id: ModuleId; title: string }[];
  moduleTitle: (id: ModuleId) => string;
  setFilters: (changes: Partial<NotificationsPanelFilters>) => void;
}

/** Application, type and expired filters, behind the filter button. */
const MoreFilters = ({
  filters,
  moduleOptions,
  moduleTitle,
  setFilters,
}: MoreFiltersProps) => {
  const active =
    filters.moduleIds.length > 0 ||
    filters.kinds.length > 0 ||
    filters.hideExpired;
  return (
    <Overlay placement="bottom-end">
      <OverlayTrigger>
        <Button
          appearance={active ? "solid" : "bordered"}
          aria-label="More filters"
          className={`${classBase}-filterButton`}
          sentiment={active ? "accented" : "neutral"}
        >
          <Icon name="filter" />
        </Button>
      </OverlayTrigger>
      <OverlayPanel aria-label="More filters" className={`${classBase}-more`}>
        <OverlayPanelContent className={`${classBase}-moreContent`}>
          <Dropdown<ModuleId>
            aria-label="Applications"
            bordered
            multiselect
            onSelectionChange={(_: SyntheticEvent, moduleIds: ModuleId[]) =>
              setFilters({ moduleIds })
            }
            placeholder="All applications"
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
          <Checkbox
            checked={filters.hideExpired}
            label="Hide expired"
            onChange={(event) =>
              setFilters({ hideExpired: event.target.checked })
            }
          />
        </OverlayPanelContent>
      </OverlayPanel>
    </Overlay>
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

  const visible = filters.hideExpired
    ? allNotifications.filter(({ expired }) => !expired)
    : allNotifications;
  const levelCounts = (level: NotificationLevel) =>
    visible.filter((n) => n.level === level).length;
  const totalUnread = visible.filter((n) => !n.read).length;
  const unreadKeys = notifications.filter((n) => !n.read).map((n) => n.key);
  const readKeys = notifications.filter((n) => n.read).map((n) => n.key);
  const filtered = isFiltered(filters);
  const close = () => presentation?.closePanel();
  const select = (key: string) => {
    setSelectedKey((current) => (current === key ? undefined : key));
    api.markRead([key]);
  };

  const emptyState = () => {
    if (filtered) {
      return (
        <>
          <Text styleAs="h4">No notifications match</Text>
          <Button
            appearance="bordered"
            onClick={() => setFilters(DEFAULT_FILTERS)}
            sentiment="neutral"
          >
            Clear filters
          </Button>
        </>
      );
    }
    if (filters.unreadOnly && visible.length > 0) {
      return (
        <>
          <Text styleAs="h4">You're all caught up</Text>
          <Text color="secondary">
            No unread notifications. {visible.length} in All.
          </Text>
          <Button
            appearance="bordered"
            onClick={() => setFilters({ unreadOnly: false })}
            sentiment="neutral"
          >
            Show all
          </Button>
        </>
      );
    }
    return <Text styleAs="h4">No notifications today</Text>;
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
        <Text as="h2" className={`${classBase}-title`}>
          Notifications
        </Text>
        {totalUnread > 0 ? (
          <span className={`${classBase}-unreadCount`}>
            {totalUnread} unread
          </span>
        ) : null}
        {presentation?.doNotDisturb ? (
          <span className={`${classBase}-dndTag`}>Do not disturb</span>
        ) : null}
        <span className={`${classBase}-headerEnd`}>
          <Button
            appearance="transparent"
            aria-label="Mark all read"
            disabled={unreadKeys.length === 0}
            onClick={() => api.markRead(unreadKeys)}
            sentiment="neutral"
            title="Mark all read"
          >
            <Icon name="tick" />
          </Button>
          <Menu>
            <MenuTrigger>
              <Button
                appearance="transparent"
                aria-label="More actions"
                sentiment="neutral"
              >
                <Icon name="more-horiz" />
              </Button>
            </MenuTrigger>
            <MenuPanel>
              <MenuItem
                disabled={readKeys.length === 0}
                onClick={() => api.delete(readKeys)}
              >
                Delete read
              </MenuItem>
            </MenuPanel>
          </Menu>
          <Button
            appearance="transparent"
            aria-label="Close notifications"
            onClick={close}
            sentiment="neutral"
          >
            <Icon name="close" />
          </Button>
        </span>
      </div>

      <div className={`${classBase}-toolbar`}>
        <ToggleButtonGroup
          aria-label="Read state"
          onChange={(event) =>
            setFilters({
              unreadOnly: event.currentTarget.value === "unread",
            })
          }
          value={filters.unreadOnly ? "unread" : "all"}
        >
          <ToggleButton value="unread">Unread {totalUnread}</ToggleButton>
          <ToggleButton value="all">All {visible.length}</ToggleButton>
        </ToggleButtonGroup>
        <Input
          bordered
          className={`${classBase}-search`}
          inputProps={{ "aria-label": "Search notifications" }}
          onChange={(event) =>
            setFilters({ text: (event.target as HTMLInputElement).value })
          }
          placeholder="Search title and message"
          startAdornment={<Icon name="search" />}
          value={filters.text}
        />
        <MoreFilters
          filters={filters}
          moduleOptions={moduleOptions}
          moduleTitle={moduleTitle}
          setFilters={setFilters}
        />
      </div>

      <div className={`${classBase}-chips`}>
        <PillGroup
          aria-label="Levels"
          onSelectionChange={(_, levels) =>
            setFilters({ levels: levels as NotificationLevel[] })
          }
          selected={filters.levels}
          selectionVariant="multiple"
        >
          {LEVELS.map((level) => (
            <Pill
              className={`${classBase}-levelPill`}
              key={level}
              value={level}
            >
              <span
                aria-hidden
                className={`${classBase}-levelDot`}
                data-level={level}
              />
              {LEVEL_LABELS[level]}
              <span className={`${classBase}-count`}>{levelCounts(level)}</span>
            </Pill>
          ))}
        </PillGroup>
        {filters.moduleIds.map((id) => (
          <Pill
            aria-label={`Remove ${moduleTitle(id)} filter`}
            className={`${classBase}-scopePill`}
            key={id}
            onClick={() =>
              setFilters({
                moduleIds: filters.moduleIds.filter((m) => m !== id),
              })
            }
          >
            {moduleTitle(id)}
            <Icon name="close" />
          </Pill>
        ))}
      </div>

      {filtered ? (
        <div className={`${classBase}-matches`}>
          <span>
            <strong>{notifications.length}</strong> of {allNotifications.length}{" "}
            match
          </span>
          <Button
            appearance="transparent"
            onClick={() => setFilters(DEFAULT_FILTERS)}
            sentiment="accented"
          >
            Clear filters
          </Button>
        </div>
      ) : null}

      {presentation?.doNotDisturb ? (
        <div className={`${classBase}-dndNotice`}>
          <div>
            <strong>Toasts and banners are held</strong>
            <div>New notifications are listed here and in the nav badges.</div>
          </div>
          <Button
            appearance="bordered"
            onClick={() => presentation.setDoNotDisturb(false)}
            sentiment="neutral"
          >
            Turn off
          </Button>
        </div>
      ) : null}

      <div className={`${classBase}-list`} ref={listRef}>
        {notifications.length === 0 ? (
          <div className={`${classBase}-empty`}>{emptyState()}</div>
        ) : (
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
        )}
      </div>

      {presentation ? (
        <div className={`${classBase}-footer`}>
          <Switch
            checked={presentation.doNotDisturb}
            label="Do not disturb"
            onChange={(event) =>
              presentation.setDoNotDisturb(event.target.checked)
            }
          />
        </div>
      ) : null}
    </div>
  );
};

/**
 * Today's notifications from every server and from client code, with
 * filters and actions, in a drawer on the right. `PortalShell` renders it;
 * open it with `useNotificationPresentation().openPanel()`.
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
