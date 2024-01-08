import { RuntimeColumnDescriptor } from "@finos/vuu-table-types";
import { VuuRange } from "@finos/vuu-protocol-types";
import { RowAtPositionFunc } from "@finos/vuu-utils";
import { useCallback, useEffect, useRef } from "react";
import { ViewportMeasurements } from "./useTableViewport";

export interface VirtualViewportHookProps {
  columns: RuntimeColumnDescriptor[];
  getRowAtPosition: RowAtPositionFunc;
  setRange: (range: VuuRange) => void;
  viewportMeasurements: ViewportMeasurements;
}

export const useVirtualViewport = ({
  getRowAtPosition,
  setRange,
  viewportMeasurements,
}: VirtualViewportHookProps) => {
  const firstRowRef = useRef<number>(0);
  const { rowCount: viewportRowCount } = viewportMeasurements;

  const handleVerticalScroll = useCallback(
    (scrollTop: number) => {
      const firstRow = getRowAtPosition(scrollTop);
      if (firstRow !== firstRowRef.current) {
        firstRowRef.current = firstRow;
        setRange({ from: firstRow, to: firstRow + viewportRowCount + 1 });
      }
    },
    [getRowAtPosition, setRange, viewportRowCount]
  );

  useEffect(() => {
    const { current: from } = firstRowRef;
    const rowRange = { from, to: from + viewportRowCount + 1 };
    setRange(rowRange);
  }, [setRange, viewportRowCount]);

  return {
    onVerticalScroll: handleVerticalScroll,
  };
};
