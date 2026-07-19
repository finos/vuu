import { useContextMenu } from "@vuu-ui/vuu-context-menu";
import { DataSourceRow } from "@vuu-ui/vuu-data-types";
import { useCallback } from "react";
import { ECElementEvent } from "echarts";
import { DataSourceValue } from "./ChartSeries";
import { ColumnMap } from "@vuu-ui/vuu-utils";

export type ChartMenuLocation = "canvas" | "series";

export type ChartContextMenuOptions = {
  column: string;
  columnMap: ColumnMap;
  row: DataSourceRow;
};

interface ChartContextMenuHookProps {
  allowContextMenu?: boolean;
  categoryColumnName?: string;
  columnMap: ColumnMap;
}

export const useChartContextMenu = ({
  columnMap,
}: ChartContextMenuHookProps) => {
  const showContextMenu = useContextMenu();

  const onContextMenu = useCallback(
    ({ data, event, seriesName }: ECElementEvent) => {
      if (event && seriesName) {
        event?.stop();

        const { row } = data as DataSourceValue;

        const menuOptions: ChartContextMenuOptions = {
          column: seriesName,
          columnMap,
          row,
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        showContextMenu(event.event as any, "series", menuOptions);
      }
    },
    [columnMap, showContextMenu],
  );

  return onContextMenu;
};
