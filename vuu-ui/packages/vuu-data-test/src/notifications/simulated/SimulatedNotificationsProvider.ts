import type { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import type { Table } from "../../Table";
import type { NotificationsProvider } from "../NotificationModule";

type NotificationTemplate = [
  type: string,
  title: string,
  messageFormat: string,
  level: string,
  durationMs: number,
  source: string,
  priority: number,
  audience: string,
];

// prettier-ignore
const sampleTemplates: NotificationTemplate[] = [
  [
    "toast",
    "Order Execution",
    "Order #%04d filled %d shares of AAPL at $%d.%02d",
    "INFO",
    12000,
    "OMS",
    2,
    "trader",
  ],
  [
    "toast",
    "Risk Limit Alert",
    "Account ACC-%04d exceeded intraday VaR limit by %d%%",
    "WARNING",
    15000,
    "RISK",
    5,
    "risk_manager",
  ],
  [
    "toast",
    "Feed Synchronization",
    "Connected to pricing feed NYC-%02d with latency %dms",
    "INFO",
    10000,
    "PRICING",
    1,
    "admin",
  ],
  [
    "toast",
    "Connection Warning",
    "Intermittent packet loss detected on gateway LDN-%02d",
    "WARNING",
    14000,
    "GATEWAY",
    3,
    "admin",
  ],
  [
    "toast",
    "Order Rejection",
    "Order #%04d rejected by exchange: Insufficient margin",
    "ERROR",
    18000,
    "OMS",
    10,
    "all",
  ],
  [
    "banner",
    "System Maintenance",
    "Scheduled system maintenance will begin in %d minutes",
    "WARNING",
    45000,
    "SYSTEM",
    5,
    "all",
  ],
  [
    "banner",
    "Market Status",
    "US Equity markets are now OPEN. Trading session #%d active",
    "INFO",
    60000,
    "SYSTEM",
    1,
    "all",
  ],
];

const MAX_ACTIVE_NOTIFICATIONS = 8;
const INITIAL_NOTIFICATIONS = 3;
const CYCLE_TIME_MS = 4_000;

const randomInt = (bound: number) => Math.floor(Math.random() * bound);

/**
 * Minimal implementation of the subset of Java String.format used by
 * the message templates: %d, %0nd and %%. Args are consumed in order.
 */
export const formatMessage = (format: string, ...args: number[]) => {
  let argIndex = 0;
  return format.replace(/%(0(\d+))?d|%%/g, (match, _, width) => {
    if (match === "%%") {
      return "%";
    }
    const value = String(args[argIndex++]);
    return width ? value.padStart(Number(width), "0") : value;
  });
};

/**
 * Generates random notifications. Seeds an initial set of notifications on
 * start then, on each cycle, deletes expired notifications and adds a new
 * notification if fewer than the maximum are active.
 */
export class SimulatedNotificationsProvider implements NotificationsProvider {
  #activeNotifications = new Map<string, number>();
  #table: Table;
  #timer: ReturnType<typeof setInterval> | undefined;

  constructor(table: Table) {
    this.#table = table;
  }

  start() {
    if (this.#timer === undefined) {
      for (let i = 0; i < INITIAL_NOTIFICATIONS; i++) {
        this.generateRandomNotification();
      }
      this.#timer = setInterval(this.runOnce, CYCLE_TIME_MS);
    }
  }

  stop() {
    if (this.#timer !== undefined) {
      clearInterval(this.#timer);
      this.#timer = undefined;
    }
  }

  runOnce = () => {
    try {
      const now = Date.now();

      // 1. Clean up expired notifications
      for (const [id, expiryTime] of Array.from(this.#activeNotifications)) {
        if (expiryTime < now) {
          this.#table.delete(id);
          this.#activeNotifications.delete(id);
        }
      }

      // 2. Generate new notifications if we have fewer than 8 active notifications
      if (this.#activeNotifications.size < MAX_ACTIVE_NOTIFICATIONS) {
        this.generateRandomNotification();
      }
    } catch (e) {
      console.error(
        "Error occurred in SimulatedNotificationsProvider runOnce",
        e,
      );
    }
  };

  private generateRandomNotification() {
    const id = crypto.randomUUID();
    const now = Date.now();
    const [
      type,
      title,
      messageFormat,
      level,
      duration,
      source,
      priority,
      audience,
    ] = sampleTemplates[randomInt(sampleTemplates.length)];
    const expiryTime = now + duration;

    const message = messageFormat.includes("%")
      ? formatMessage(
          messageFormat,
          randomInt(9000) + 1000,
          randomInt(90) * 10 + 100,
          randomInt(200) + 50,
          randomInt(99),
        )
      : messageFormat;

    const rowData: Record<string, VuuRowDataItemType> = {
      id,
      type,
      expiryTime,
      title,
      message,
      level,
      audience,
      source,
      priority,
      status: "",
      dismissedBy: "",
      vuuCreatedTimestamp: now,
      vuuUpdatedTimestamp: now,
      vuuMsg: "",
    };

    this.#table.insert(this.toDataRow(rowData));
    this.#activeNotifications.set(id, expiryTime);
  }

  private toDataRow(rowData: Record<string, VuuRowDataItemType>) {
    const { map, schema } = this.#table;
    const row: VuuRowDataItemType[] = Array(schema.columns.length);
    for (const [name, value] of Object.entries(rowData)) {
      const idx = map[name];
      if (idx !== undefined) {
        row[idx] = value;
      }
    }
    return row;
  }
}
