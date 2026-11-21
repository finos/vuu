import { Button, StatusIndicator } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { useEffect, useId, useRef } from "react";
import {
  isUnavailablePresence,
  type VuuServerStatus,
} from "../connection-management/server-status";
import { formatDuration, formatTime } from "../server-monitor/presence-format";
import {
  useRetryConnection,
  useVuuServerStatus,
} from "../server-monitor/VuuServerMonitorProvider";
import connectionLostOverlayCss from "./ConnectionLostOverlay.css";

const classBase = "vuuConnectionLostOverlay";

/**
 * The status of a module's server when it can't be used, i.e. offline,
 * including a lost connection still reconnecting after the grace period,
 * or unauthorized. Otherwise undefined.
 */
export const useLostConnectionStatus = (connectionId?: string) => {
  const status = useVuuServerStatus(connectionId ?? "");
  return connectionId !== undefined &&
    isUnavailablePresence(status.presence) &&
    status.presence !== "unavailable"
    ? status
    : undefined;
};

export interface ConnectionLostOverlayProps {
  status: VuuServerStatus;
  /** The module's title. */
  title?: string;
}

/**
 * Covers a remote module whose server can't be reached, so that its stale
 * UI can't be used, and explains what is happening.
 */
export const ConnectionLostOverlay = ({
  status,
  title = "This application",
}: ConnectionLostOverlayProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-connection-lost-overlay",
    css: connectionLostOverlayCss,
    window: targetWindow,
  });
  const headlineId = useId();
  const reasonId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const retry = useRetryConnection();
  const { connectionId, detail, presence, since } = status;
  const unauthorized = presence === "unauthorized";

  useEffect(() => {
    // The module is inert, so focus must not stay inside it.
    dialogRef.current?.focus();
  }, []);

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
    <div className={classBase}>
      <div
        aria-describedby={reasonId}
        aria-labelledby={headlineId}
        aria-modal="true"
        className={`${classBase}-dialog`}
        ref={dialogRef}
        role="alertdialog"
        tabIndex={-1}
      >
        <div className={`${classBase}-headline`} id={headlineId}>
          <StatusIndicator
            aria-hidden
            status={unauthorized ? "error" : "warning"}
          />
          <span>
            {unauthorized
              ? `${title} can't access its server`
              : `${title} has lost its connection`}
          </span>
        </div>
        <div id={reasonId}>{detail?.reason ?? "Server unavailable"}</div>
        {since ? (
          <div className={`${classBase}-since`}>
            {unauthorized ? "Unavailable" : "Offline"} since {formatTime(since)}{" "}
            ({formatDuration(Date.now() - since)}){lastOnline}
          </div>
        ) : null}
        {retryText ? (
          <div aria-live="polite" className={`${classBase}-retry`}>
            {retryText}
          </div>
        ) : null}
        {unauthorized ? null : (
          <div className={`${classBase}-actions`}>
            <Button
              disabled={detail?.checking}
              focusableWhenDisabled
              onClick={() => retry(connectionId)}
              sentiment="accented"
            >
              Retry now
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
