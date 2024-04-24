import React, { useEffect, useState } from "react";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";

import cx from "clsx";

import connectionStatusIndicatorCss from "./ConnectionStatusIndicator.css";

type connectionStatus =
  | "connected"
  | "reconnected"
  | "connecting"
  | "disconnected";

interface ConnectionStatusProps {
  connectionStatus: connectionStatus;
  className?: string;
  props?: unknown;
  element?: string;
}

export const ConnectionStatusIndicator = ({
  connectionStatus,
  className,
  element = "span",
  ...props
}: ConnectionStatusProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-connection-status-indicator",
    css: connectionStatusIndicatorCss,
    window: targetWindow,
  });

  const [classBase, setClassBase] = useState<string>("vuuConnectingStatus");
  useEffect(() => {
    switch (connectionStatus) {
      case "connected":
      case "reconnected":
        setClassBase("vuuActiveStatus");
        break;
      case "connecting":
        setClassBase("vuuConnectingStatus");
        break;
      case "disconnected":
        setClassBase("vuuDisconnectedStatus");
        break;
      default:
        break;
    }
  }, [connectionStatus]);

  const statusIcon = React.createElement(element, {
    ...props,
    className: cx("vuuStatus vuuIcon", classBase, className),
  });

  return (
    <>
      <div className="vuuStatus-container salt-theme">
        {statusIcon}
        <div className="vuuStatus-text">
          Status: {connectionStatus.toUpperCase()}
        </div>
      </div>
    </>
  );
};
