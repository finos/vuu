import { RefObject, useCallback, useMemo, useRef, useState } from "react";
import { KeySet } from "@finos/vuu-utils";

export interface ScrollHookProps {
  bufferCount: number;
  dataRowCount: number;
  rowHeight: number;
  table: RefObject<HTMLDivElement>;
  visibleRowCount: number;
}

export const useScroll = ({
  bufferCount,
  dataRowCount,
  rowHeight,
  table,
  visibleRowCount,
}: ScrollHookProps) => {
  const scrollTopRef = useRef(0);
  const [firstRowIndex, setFirstRowIndex] = useState(0);
  const renderedRowsCount = visibleRowCount + 2 * bufferCount;
  const bufferHeight = bufferCount * rowHeight;
  const lastRowIndex = firstRowIndex + renderedRowsCount;

  const keys = useMemo(() => new KeySet({ from: 0, to: 0 }), []);
  keys.reset({ from: firstRowIndex, to: lastRowIndex });

  const handleScroll = useCallback(
    (e) => {
      const { scrollLeft, scrollTop } = e.target;
      const scrolledBy = scrollTop - scrollTopRef.current;
      const isForwards = scrolledBy > 0;

      if (
        isForwards &&
        (Math.abs(scrolledBy) > bufferHeight || scrollTop < bufferHeight)
      ) {
        scrollTopRef.current =
          Math.floor(scrollTop / bufferHeight) * bufferHeight;

        const firstRowIndex = Math.max(
          0,
          Math.floor(scrollTopRef.current / rowHeight) - bufferCount
        );
        if (firstRowIndex + renderedRowsCount > dataRowCount) {
          setFirstRowIndex(dataRowCount - renderedRowsCount);
        } else {
          setFirstRowIndex(firstRowIndex);
        }
      } else if (
        !isForwards &&
        (Math.abs(scrolledBy) > bufferHeight || scrollTop < bufferHeight)
      ) {
        while (scrollTopRef.current - scrollTop > bufferHeight) {
          scrollTopRef.current -= bufferHeight;
        }

        const firstRowIndex = Math.max(
          0,
          Math.floor(scrollTopRef.current / rowHeight) - bufferCount
        );
        if (firstRowIndex + renderedRowsCount > dataRowCount) {
          setFirstRowIndex(dataRowCount - renderedRowsCount);
        } else {
          setFirstRowIndex(firstRowIndex);
        }
      }

      if (table.current) {
        table.current.scrollLeft = scrollLeft;
        table.current.scrollTop = scrollTop;
      }
    },
    [
      bufferCount,
      bufferHeight,
      dataRowCount,
      renderedRowsCount,
      rowHeight,
      table,
    ]
  );

  return {
    firstRowIndex,
    handleScroll,
    keys,
    lastRowIndex,
  };
};
