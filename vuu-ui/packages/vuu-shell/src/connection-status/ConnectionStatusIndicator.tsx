import { CSSProperties, memo, useMemo, useRef } from "react";
import type { WebSocketConnectionState } from "@vuu-ui/vuu-data-remote";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";

import cx from "clsx";

import connectionStatusIndicatorCss from "./ConnectionStatusIndicator.css";

const classBase = "ConnectionStatusIndicator";

interface BallProps {
  background?: string;
  i?: number;
  large?: boolean;
}
const Ball = memo(({ background, i = 0, large = false }: BallProps) => {
  if (large) {
    return <div className="Ball large" key={i} style={{ background }} />;
  } else {
    return (
      <div
        className="Ball small"
        key={i}
        style={{ "--i": -(i + 1), background } as CSSProperties}
      />
    );
  }
});
Ball.displayName = "Ball";

interface ConnectionStatusIndicatorProps {
  connectionState: WebSocketConnectionState;
}

export const ConnectionStatusIndicator = ({
  connectionState,
}: ConnectionStatusIndicatorProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-connection-status-indicator",
    css: connectionStatusIndicatorCss,
    window: targetWindow,
  });

  const ballbox = useRef<HTMLDivElement>(null);
  const expandedRef = useRef(false);
  const { connectionStatus, retryAttemptsRemaining, retryAttemptsTotal } =
    connectionState;

  if (connectionStatus === "disconnected") {
    // one way switch
    expandedRef.current = true;
  }
  const finalState =
    connectionStatus === "connected" || connectionStatus === "closed";

  useMemo(() => {
    if (finalState) {
      expandedRef.current = false;
    }
  }, [finalState]);

  const getSmallBalls = () => {
    const colors = Array(retryAttemptsTotal).fill("lightgray");
    const index = retryAttemptsTotal - retryAttemptsRemaining;
    if (retryAttemptsRemaining) {
      colors[index] = "orange";
      for (let i = 0; i < index; i++) {
        colors[i] = "red";
      }
    } else {
      colors.fill("red");
    }
    colors.reverse();
    return colors.map((background, i) => (
      <Ball key={i} i={i} background={background} />
    ));
  };

  const balls = getSmallBalls();

  // const displayState = balls.length > 0 ? "disconnected" : connectionStatus;
  const displayState = connectionStatus;
  const retryCount =
    connectionStatus === "disconnected" ? retryAttemptsTotal : 0;

  return (
    <div
      className={cx(classBase, `${classBase}-${displayState}`, {
        expanded: expandedRef.current,
      })}
      ref={ballbox}
      style={{ "--retry-count": retryCount } as CSSProperties}
    >
      <Ball large />
      {balls}
    </div>
  );
};
