import { RuntimeColumnDescriptor } from "@finos/vuu-datagrid-types";
import { VuuRange } from "@finos/vuu-protocol-types";
import { RowAtPositionFunc } from "@finos/vuu-utils";
import { useCallback, useEffect, useRef } from "react";
import { ViewportMeasurements } from "@finos/vuu-table";

export interface VirtualViewportHookProps {
  columns: RuntimeColumnDescriptor[];
  getRowAtPosition: RowAtPositionFunc;
  setRange: (range: VuuRange) => void;
  viewportMeasurements: ViewportMeasurements;
}

export const useVirtualViewport = ({
  columns,
  getRowAtPosition,
  setRange,
  viewportMeasurements,
}: VirtualViewportHookProps) => {
  const firstRowRef = useRef<number>(0);
  const { contentWidth, rowCount: viewportRowCount } = viewportMeasurements;

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

  useEffect(() => {
    const { current: from } = firstRowRef;
    const rowRange = { from, to: from + viewportRowCount };
    setRange(rowRange);
  }, [setRange, viewportRowCount]);

  return {
    onVerticalScroll: handleVerticalScroll,
  };
};
