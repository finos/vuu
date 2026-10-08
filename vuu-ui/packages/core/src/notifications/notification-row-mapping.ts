import type {
  NotificationKind,
  NotificationLevel,
  PortalNotification,
} from "./notification-types";

export const NOTIFICATIONS_TABLE = {
  module: "NOTIFICATIONS",
  table: "notifications",
} as const;

/** Columns mapped to `PortalNotification` fields, not to `attributes`. */
const MAPPED_COLUMNS = new Set([
  "audience",
  "expiryTime",
  "id",
  "level",
  "message",
  "title",
  "type",
  "vuuCreatedTimestamp",
  "vuuMsg",
  "vuuUpdatedTimestamp",
]);

const LEVELS: Record<string, NotificationLevel> = {
  ERROR: "error",
  INFO: "info",
  SUCCESS: "success",
  WARNING: "warning",
};

const KINDS: Record<string, NotificationKind> = {
  banner: "banner",
  toast: "toast",
};

export const toNotificationLevel = (value: unknown): NotificationLevel =>
  LEVELS[String(value).toUpperCase()] ?? "info";

export const toNotificationKind = (value: unknown): NotificationKind =>
  KINDS[String(value).toLowerCase()] ?? "silent";

const toEpoch = (value: unknown) =>
  typeof value === "number" && value > 0 ? value : undefined;

export const serverNotificationKey = (connectionId: string, id: string) =>
  `${connectionId}:${id}`;

export interface ServerNotificationRow {
  connectionId: string;
  /** Column values by column name. */
  values: Record<string, unknown>;
  /** The row key, used when the row has no `id` value. */
  rowKey: string;
}

/**
 * Maps a row of the `NOTIFICATIONS/notifications` table. The notification is
 * unattributed and unread; the store decides its read state.
 */
export const toPortalNotification = (
  { connectionId, rowKey, values }: ServerNotificationRow,
  { initial, receivedAt }: { initial: boolean; receivedAt: number },
): PortalNotification => {
  const id = values.id === undefined ? rowKey : String(values.id);
  const attributes: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(values)) {
    if (!MAPPED_COLUMNS.has(name)) {
      attributes[name] = value;
    }
  }
  return {
    attributes,
    createdAt: toEpoch(values.vuuCreatedTimestamp) ?? receivedAt,
    expired: false,
    expiresAt: toEpoch(values.expiryTime),
    id,
    initial,
    key: serverNotificationKey(connectionId, id),
    kind: toNotificationKind(values.type),
    level: toNotificationLevel(values.level),
    message: values.message === undefined ? "" : String(values.message),
    origin: { connectionId, moduleIds: [], source: "server" },
    read: false,
    receivedAt,
    title: values.title === undefined ? "" : String(values.title),
  };
};
