import type {
  VuuServerPresence,
  VuuServerStatus,
} from "../connection-management/server-status";
import { formatTime } from "../server-monitor/presence-format";

export type ConnectionSeverity = "ok" | "unknown" | "warning" | "error";

export interface PortalConnectionStatusItem {
  connectionId: string;
  label: string;
  status: VuuServerStatus;
}

const SEVERITY_RANK: Record<ConnectionSeverity, number> = {
  ok: 0,
  unknown: 1,
  warning: 2,
  error: 3,
};

export const presenceSeverity = (
  presence: VuuServerPresence,
): ConnectionSeverity => {
  switch (presence) {
    case "online":
      return "ok";
    case "connecting":
    case "degraded":
      return "warning";
    case "offline":
    case "unauthorized":
    case "unavailable":
      return "error";
    default:
      return "unknown";
  }
};

/** Lower-case state text, e.g. "reconnecting…". */
export const presenceText = (presence: VuuServerPresence) => {
  switch (presence) {
    case "online":
      return "connected";
    case "connecting":
      return "connecting…";
    case "degraded":
      return "reconnecting…";
    case "offline":
      return "offline";
    case "unauthorized":
      return "unauthorized";
    case "unavailable":
      return "unavailable";
    default:
      return "status unknown";
  }
};

/** The first connection with the worst presence. */
export const worstConnection = (items: readonly PortalConnectionStatusItem[]) =>
  items.reduce<PortalConnectionStatusItem | undefined>(
    (worst, item) =>
      !worst ||
      SEVERITY_RANK[presenceSeverity(item.status.presence)] >
        SEVERITY_RANK[presenceSeverity(worst.status.presence)]
        ? item
        : worst,
    undefined,
  );

export interface ConnectionSummary {
  severity: ConnectionSeverity;
  /** "Connected", or names the worst connection, e.g. "Portal offline". */
  label: string;
  /** Heading for the breakdown, e.g. "All systems connected". */
  title: string;
}

export const summarizeConnections = (
  items: readonly PortalConnectionStatusItem[],
): ConnectionSummary => {
  const worst = worstConnection(items);
  if (!worst) {
    return {
      label: "No connections",
      severity: "unknown",
      title: "No connections",
    };
  }
  const severity = presenceSeverity(worst.status.presence);
  if (severity === "ok") {
    return { label: "Connected", severity, title: "All systems connected" };
  }
  const label = `${worst.label} ${presenceText(worst.status.presence)}`;
  const title =
    severity === "warning"
      ? "Degraded"
      : severity === "error"
        ? items.every(
            ({ status }) => presenceSeverity(status.presence) === "error",
          )
          ? "Offline"
          : "Partially offline"
        : "Connection status";
  return { label, severity, title };
};

/** When the next automatic attempt is due, e.g. "retry in 4s". */
export const formatNextAttempt = (nextAttemptAt: number, now: number) => {
  const seconds = Math.max(0, Math.ceil((nextAttemptAt - now) / 1000));
  if (seconds === 0) {
    return "retrying now";
  }
  return seconds < 60
    ? `retry in ${seconds}s`
    : `retry at ${formatTime(nextAttemptAt)}`;
};

/** The short state shown at the end of a connection row. */
export const connectionStateText = (status: VuuServerStatus, now: number) => {
  const { detail, presence } = status;
  const state = presenceText(presence);
  if (detail?.checking) {
    return `${state} · checking…`;
  }
  if (detail?.nextAttemptAt !== undefined && presence !== "online") {
    return `${state} · ${formatNextAttempt(detail.nextAttemptAt, now)}`;
  }
  return state;
};

/** Retry applies to servers that are down for a reason other than access. */
export const canRetry = ({ presence }: VuuServerStatus) =>
  presence === "connecting" ||
  presence === "degraded" ||
  presence === "offline" ||
  presence === "unavailable";
