import { isValidNumber } from "@vuu-ui/vuu-utils";
import { RefCallback, useCallback, useMemo, useRef, useState } from "react";

interface MeasuredHeightHookProps {
  onHeightMeasured?: (height: number) => void;
  height?: number;
}

export const useMeasuredHeight = ({
  onHeightMeasured,
  height: heightProp = 0,
}: MeasuredHeightHookProps) => {
  const [measuredHeight, setMeasuredHeight] = useState(heightProp);
  const lastMeasuredHeight = useRef(-1);

  const resizeObserver = useMemo(() => {
    return new ResizeObserver((entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        const [{ blockSize: measuredSize }] = entry.borderBoxSize;
        const newHeight = Math.round(measuredSize);
        if (lastMeasuredHeight.current !== newHeight) {
          if (isValidNumber(newHeight)) {
            lastMeasuredHeight.current = newHeight;
            setMeasuredHeight(newHeight);
            onHeightMeasured?.(newHeight);
          }
        }
      }
    });
  }, [onHeightMeasured]);

  const measuredRef = useCallback<RefCallback<HTMLDivElement>>(
    (el) => {
      if (el) {
        if (heightProp === 0) {
          const { height } = el.getBoundingClientRect();
          resizeObserver.observe(el);
          // avoids tiny sub-pixel discrepancies
          const measuredHeight = Math.round(height);
          setMeasuredHeight(measuredHeight);
        }
      } else {
        resizeObserver.disconnect();
      }
    },
    [resizeObserver, heightProp],
  );
  return { measuredHeight, measuredRef };
};
