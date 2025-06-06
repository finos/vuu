import { isValidNumber } from "@vuu-ui/vuu-utils";
import { RefCallback, useCallback, useMemo, useState } from "react";

interface MeasuredHeightHookProps {
  onHeightMeasured?: (height: number) => void;
  height?: number;
}

export const useMeasuredHeight = ({
  onHeightMeasured,
  height: heightProp = 0,
}: MeasuredHeightHookProps) => {
  const [measuredHeight, setMeasuredHeight] = useState(heightProp);

  const resizeObserver = useMemo(() => {
    return new ResizeObserver((entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        const [{ blockSize: measuredSize }] = entry.borderBoxSize;
        const newHeight = Math.round(measuredSize);
        if (isValidNumber(newHeight)) {
          console.log(`ResizeObserver height=${newHeight}`);
          setMeasuredHeight(newHeight);
          onHeightMeasured?.(newHeight);
        }
      }
    });
  }, [onHeightMeasured]);

  const measuredRef = useCallback<RefCallback<HTMLDivElement>>(
    (el) => {
      if (el) {
        console.log(`[useMeasuredHeight] `);
        if (heightProp === 0) {
          const { height } = el.getBoundingClientRect();
          console.log(`[useMeasuredHeight] initialHeight = ${height}`);
          resizeObserver.observe(el);
          // avoids tiny sub-pixel discrepancies
          setMeasuredHeight(Math.round(height));
        }
      } else {
        resizeObserver.disconnect();
      }
    },
    [resizeObserver, heightProp],
  );
  return { measuredHeight, measuredRef };
};
