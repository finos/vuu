import { Button, Tooltip } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import {
  type HTMLAttributes,
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";
import type { VuuServerStatus } from "../connection-management/server-status";
import {
  useRetryConnection,
  useVuuServerStatuses,
} from "../server-monitor/VuuServerMonitorProvider";
import {
  type ConnectionSeverity,
  canRetry,
  connectionStateText,
  type PortalConnectionStatusItem,
  presenceSeverity,
  summarizeConnections,
} from "./connection-status-utils";
import {
  type PortalNavFooterVariant,
  useFooterPopover,
} from "./useFooterPopover";

import portalConnectionStatusCss from "./PortalConnectionStatus.css";

const classBase = "vuuPortalConnectionStatus";

export const CONNECTION_STATUS_OPEN_DELAY_MS = 400;
export const CONNECTION_STATUS_CLOSE_DELAY_MS = 300;

export interface PortalConnectionDescriptor {
  /** The Vuu connection id, e.g. `"portal"`. */
  connectionId: string;
  /** Friendly name, e.g. "Trading". */
  label: string;
  /** What is degraded while this connection is not healthy. */
  impact?: string;
  /** Extra detail for the breakdown row, e.g. session phase. */
  detail?: ReactNode;
}

export interface PortalConnectionStatusProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /**
   * The connections to show, in order. Default: every monitored
   * connection, labelled by its id.
   */
  connections?: readonly PortalConnectionDescriptor[];
  /** `rail` shows the status dot only, for the icons-only nav. */
  variant: PortalNavFooterVariant;
}

const unknownStatus = (connectionId: string): VuuServerStatus => ({
  connectionId,
  monitored: false,
  presence: "unknown",
  since: 0,
});

/** Re-renders every second while `enabled`, for retry countdowns. */
const useNow = (enabled: boolean) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) return;
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [enabled]);
  return enabled ? now : Date.now();
};

const StatusDot = ({ severity }: { severity: ConnectionSeverity }) => (
  <span aria-hidden className={`${classBase}-dot`} data-severity={severity} />
);

/**
 * The connection status for the nav footer: a dot showing the worst state
 * across the portal's Vuu connections, with a breakdown popover listing
 * each connection with Retry.
 */
export const PortalConnectionStatus = ({
  className,
  connections,
  variant,
  ...htmlAttributes
}: PortalConnectionStatusProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-portal-connection-status",
    css: portalConnectionStatusCss,
    window: targetWindow,
  });

  const statuses = useVuuServerStatuses();
  const retry = useRetryConnection();

  const items = useMemo<PortalConnectionStatusItem[]>(() => {
    if (connections) {
      return connections.map(({ connectionId, label }) => ({
        connectionId,
        label,
        status: statuses.get(connectionId) ?? unknownStatus(connectionId),
      }));
    }
    return [...statuses.values()]
      .filter((status) => status.monitored)
      .map((status) => ({
        connectionId: status.connectionId,
        label: status.connectionId,
        status,
      }));
  }, [connections, statuses]);

  const descriptors = useMemo(
    () =>
      new Map(
        (connections ?? []).map((connection) => [
          connection.connectionId,
          connection,
        ]),
      ),
    [connections],
  );

  const summary = summarizeConnections(items);
  const titleId = useId();

  const { floatingProps, open, triggerProps } = useFooterPopover({
    closeDelay: CONNECTION_STATUS_CLOSE_DELAY_MS,
    focusOnOpen: (floating) => floating.focus(),
    openDelay: CONNECTION_STATUS_OPEN_DELAY_MS,
    variant,
  });

  const now = useNow(
    open &&
      items.some(({ status }) => status.detail?.nextAttemptAt !== undefined),
  );

  const rail = variant === "rail";

  const trigger = (
    <button
      {...triggerProps}
      aria-haspopup="dialog"
      aria-label={`Connection status: ${summary.label}`}
      className={`${classBase}-trigger`}
      data-severity={summary.severity}
      type="button"
    >
      <StatusDot severity={summary.severity} />
      {rail ? null : (
        <span aria-hidden className={`${classBase}-label`}>
          {summary.label}
        </span>
      )}
    </button>
  );

  return (
    <div
      {...htmlAttributes}
      className={cx(classBase, `${classBase}-${variant}`, className)}
      data-severity={summary.severity}
    >
      {rail ? (
        <Tooltip content={summary.label} disabled={open} placement="right">
          {trigger}
        </Tooltip>
      ) : (
        trigger
      )}
      {open ? (
        <div
          {...floatingProps}
          aria-labelledby={titleId}
          className={`${classBase}-popover`}
          role="dialog"
          tabIndex={-1}
        >
          <div className={`${classBase}-header`}>
            <StatusDot severity={summary.severity} />
            <span className={`${classBase}-title`} id={titleId}>
              {summary.title}
            </span>
          </div>
          {items.length === 0 ? (
            <div className={`${classBase}-empty`}>
              No connections are being monitored.
            </div>
          ) : (
            <ul className={`${classBase}-rows`}>
              {items.map(({ connectionId, label, status }) => {
                const severity = presenceSeverity(status.presence);
                const descriptor = descriptors.get(connectionId);
                const healthy = severity === "ok";
                const endpoint = status.detail?.endpoint;
                const reason = healthy ? undefined : status.detail?.reason;
                return (
                  <li
                    className={`${classBase}-row`}
                    data-connection-id={connectionId}
                    data-severity={severity}
                    key={connectionId}
                  >
                    <StatusDot severity={severity} />
                    <span className={`${classBase}-name`}>{label}</span>
                    <span className={`${classBase}-state`}>
                      {connectionStateText(status, now)}
                    </span>
                    {endpoint || reason ? (
                      <div className={`${classBase}-detail`}>
                        {endpoint ? (
                          <code className={`${classBase}-endpoint`}>
                            {endpoint}
                          </code>
                        ) : null}
                        {endpoint && reason ? " · " : null}
                        {reason ? (
                          <span className={`${classBase}-reason`}>
                            {reason}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                    {descriptor?.detail ? (
                      <div className={`${classBase}-detail`}>
                        {descriptor.detail}
                      </div>
                    ) : null}
                    {!healthy && descriptor?.impact ? (
                      <div className={`${classBase}-impact`}>
                        {descriptor.impact}
                      </div>
                    ) : null}
                    {canRetry(status) ? (
                      <div className={`${classBase}-actions`}>
                        <Button
                          aria-label={`Retry ${label}`}
                          disabled={status.detail?.checking}
                          onClick={() => retry(connectionId)}
                          sentiment="accented"
                        >
                          {severity === "error" ? "Reconnect" : "Retry now"}
                        </Button>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
};
