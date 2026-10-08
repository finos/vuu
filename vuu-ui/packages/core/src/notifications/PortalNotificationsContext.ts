import { createContext } from "react";
import type { ModuleId } from "../connection-management/ModuleServerMap";
import type { NotificationStore } from "./NotificationStore";
import type {
  NotificationKind,
  NotificationLevel,
  PortalNotification,
} from "./notification-types";
import type { Presentation } from "./presentation-policy";

export interface PublishedNotification {
  /** Unique within the publishing module. */
  id: string;
  kind?: NotificationKind;
  level?: NotificationLevel;
  title: string;
  message?: string;
  attributes?: Record<string, unknown>;
}

export interface PortalNotificationsAPI {
  store: NotificationStore;
  /** Records a client notification, attributed to the calling module. */
  publish: (notification: PublishedNotification) => PortalNotification;
  markRead: NotificationStore["markRead"];
  delete: NotificationStore["delete"];
}

export interface PortalNotificationsContextValue {
  store: NotificationStore;
  /** Attributes a connection no module maps to, to the module hosting it. */
  registerHost: (connectionId: string, moduleId: ModuleId) => void;
}

export const PortalNotificationsContext =
  createContext<PortalNotificationsContextValue | null>(null);

/**
 * The id of the registered module rendering this subtree. Provided by
 * `PortalShell` for each module route.
 */
export const PortalModuleIdContext = createContext<ModuleId | undefined>(
  undefined,
);

export interface PortalNotificationsPresentation {
  /** Hides toasts and banners. Notifications are still recorded. */
  doNotDisturb: boolean;
  setDoNotDisturb: (doNotDisturb: boolean) => void;
  /** The notifications panel is showing, so toasts are not needed. */
  panelOpen: boolean;
  setPanelOpen: (panelOpen: boolean) => void;
  /** Whether a notification is presented, and how. */
  presentationOf: (notification: PortalNotification) => Presentation;
}

export const PortalNotificationsPresentationContext =
  createContext<PortalNotificationsPresentation | null>(null);
