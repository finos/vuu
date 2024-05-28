import { isValidNumber } from "@finos/vuu-utils";
import { RefCallback, useCallback, useMemo, useState } from "react";

interface MeasuredHeightHookProps {
  onHeightMeasured?: (height: number) => void;
  height?: number;
}

export const useMeasuredHeight = ({
  onHeightMeasured,
  height: heightProp = 0,
}: MeasuredHeightHookProps) => {
  const [rowHeight, setRowHeight] = useState(heightProp);

  const resizeObserver = useMemo(() => {
    return new ResizeObserver((entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        const [{ blockSize: measuredSize }] = entry.borderBoxSize;
        const newHeight = Math.round(measuredSize);
        if (isValidNumber(newHeight)) {
          setRowHeight(newHeight);
          onHeightMeasured?.(newHeight);
        }
      }
    });
  }, [onHeightMeasured]);

  const rowRef = useCallback<RefCallback<HTMLDivElement>>(
    (el) => {
      if (el) {
        if (heightProp === 0) {
          const { height } = el.getBoundingClientRect();
          resizeObserver.observe(el);
          setRowHeight(height);
        }
      } else {
        resizeObserver.disconnect();
      }
    },
    [resizeObserver, heightProp]
  );
  return { rowHeight, rowRef };
};
