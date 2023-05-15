import { VuuRange } from "@finos/vuu-protocol-types";
import { RowAtPositionFunc } from "@finos/vuu-utils";
import { useCallback, useRef } from "react";

export interface VirtualViewportHookProps {
  getRowAtPosition: RowAtPositionFunc;
  setRange: (range: VuuRange) => void;
}

export const useVirtualViewport = ({
  getRowAtPosition,
  setRange,
}: VirtualViewportHookProps) => {
  const firstRowRef = useRef<number>(-1);
  const viewportRowCount = 21;

  const handleVerticalScroll = useCallback(
    (scrollTop: number) => {
      const firstRow = getRowAtPosition(scrollTop);
      if (firstRow !== firstRowRef.current) {
        firstRowRef.current = firstRow;
        setRange({ from: firstRow, to: firstRow + viewportRowCount });
      }
    },
    [getRowAtPosition, setRange, viewportRowCount]
  );

  return {
    onVerticalScroll: handleVerticalScroll,
  };
};
