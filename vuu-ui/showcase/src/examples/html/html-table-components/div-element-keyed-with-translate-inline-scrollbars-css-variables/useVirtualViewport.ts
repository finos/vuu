import { KeyedColumnDescriptor } from "@finos/vuu-datagrid-types";
import { VuuRange } from "@finos/vuu-protocol-types";
import { RowAtPositionFunc } from "@finos/vuu-utils";
import { ViewportMeasurements } from "@finos/vuu-table";
import { useCallback, useRef } from "react";

export interface VirtualViewportHookProps {
  columns: KeyedColumnDescriptor[];
  getRowAtPosition: RowAtPositionFunc;
  setRange: (range: VuuRange) => void;
  viewportMeasurements: ViewportMeasurements;
}

export const useVirtualViewport = ({
  getRowAtPosition,
  setRange,
  viewportMeasurements,
}: VirtualViewportHookProps) => {
  const firstRowRef = useRef<number>(-1);
  const { rowCount: viewportRowCount } = viewportMeasurements;

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
