import type { ModuleId } from "../connection-management/ModuleServerMap";
import type { RemoteModuleDescriptor } from "../RemoteModuleDescriptor";

export type NotificationLevel = "info" | "warning" | "error" | "success";
export type NotificationKind = "toast" | "banner" | "silent";

export interface NotificationOrigin {
  source: "server" | "client";
  /** The server that published the notification, for server notifications. */
  connectionId?: string;
  /** Modules the notification is attributed to; empty means the portal. */
  moduleIds: ModuleId[];
}

export interface PortalNotification {
  /** Unique across servers: `${connectionId}:${id}` for server notifications. */
  key: string;
  id: string;
  origin: NotificationOrigin;
  kind: NotificationKind;
  level: NotificationLevel;
  title: string;
  message: string;
  /** Server `vuuCreatedTimestamp`, or client time for client notifications. */
  createdAt: number;
  /** When the client received the notification. */
  receivedAt: number;
  /** The server's `expiryTime`, if any. */
  expiresAt?: number;
  /** The server deleted the row. */
  expired: boolean;
  /** Part of the snapshot received when the feed subscribed. */
  initial: boolean;
  read: boolean;
  /** Additional columns, e.g. source, priority. */
  attributes: Record<string, unknown>;
}

export interface NotificationQuery {
  moduleIds?: ModuleId[];
  connectionIds?: string[];
  levels?: NotificationLevel[];
  kinds?: NotificationKind[];
  read?: boolean;
  /** Defaults to true. */
  includeExpired?: boolean;
  /** Case-insensitive match on title, message or attribute values. */
  text?: string;
  since?: number;
}

export type NotificationCountFilter = Pick<
  NotificationQuery,
  "moduleIds" | "connectionIds"
>;

export type NotificationStoreEvent =
  | { type: "added"; notification: PortalNotification }
  | { type: "updated"; notification: PortalNotification }
  | { type: "removed"; keys: string[] }
  | { type: "read-state"; keys: string[] | "all" };

/**
 * Chooses the modules a server notification is attributed to, from the
 * modules that use its server. Used when a server is used by more than one
 * module, or is the portal's own server.
 */
export type NotificationAttribution = (
  notification: PortalNotification,
  modulesForServer: RemoteModuleDescriptor[],
) => ModuleId[];

export interface PortalNotificationsOptions {
  /** Default true. */
  enabled?: boolean;
  /** Notifications kept in memory. Default 500. */
  maxNotifications?: number;
  /** Rows subscribed per server. Default 200. */
  maxPerServer?: number;
  attribution?: NotificationAttribution;
}
