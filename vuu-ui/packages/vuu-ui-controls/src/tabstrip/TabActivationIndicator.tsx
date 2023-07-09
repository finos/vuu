import { useRef } from "react";
import { useActivationIndicator } from "./useActivationIndicator";

import "./TabActivationIndicator.css";

interface TabActivationIndicatorProps {
  hideThumb?: boolean;
  orientation?: "horizontal" | "vertical";
  disableAnimation?: boolean;
  tabId?: string | null;
}

const classBase = "vuuTabActivationIndicator";

export const TabActivationIndicator = ({
  hideThumb = false,
  orientation = "horizontal",
  tabId,
}: TabActivationIndicatorProps) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const style = useActivationIndicator({
    rootRef,
    tabId,
    orientation,
  });
  return (
    <div className={classBase} ref={rootRef}>
      {hideThumb === false && tabId !== null ? (
        <div className={`${classBase}-thumb`} style={style} />
      ) : null}
    </div>
  );
};
