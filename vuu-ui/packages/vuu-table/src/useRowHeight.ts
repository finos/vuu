import { isValidNumber } from "@finos/vuu-utils";
import { RefCallback, useCallback, useMemo, useRef, useState } from "react";

interface RowHeightHookProps {
  rowHeight?: number;
}

export const useRowHeight = ({
  rowHeight: rowHeightProp = 0,
}: RowHeightHookProps) => {
  const [rowHeight, setRowHeight] = useState(rowHeightProp);
  const heightRef = useRef(rowHeight);

  const resizeObserver = useMemo(() => {
    return new ResizeObserver((entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        const [{ blockSize: measuredSize }] = entry.borderBoxSize;
        const newHeight = Math.round(measuredSize);
        if (isValidNumber(newHeight) && heightRef.current !== newHeight) {
          heightRef.current = newHeight;
          setRowHeight(newHeight);
        }
      }
    });
  }, []);

  const rowRef = useCallback<RefCallback<HTMLDivElement>>(
    (el) => {
      if (el) {
        if (rowHeightProp === 0) {
          const { height } = el.getBoundingClientRect();
          console.log({ boundingClientHeight: height });
          console.log(`measured rowHeight = ${height} (${rowHeightProp})`);
          resizeObserver.observe(el);
          setRowHeight(height);
        }
      } else {
        resizeObserver.disconnect();
      }
    },
    [resizeObserver, rowHeightProp]
  );

  return { rowHeight, rowRef };
};
