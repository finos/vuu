import { useContextMenu, useHideContextMenu } from "@vuu-ui/vuu-context-menu";
import type { DataSourceRow } from "@vuu-ui/vuu-data-types";
import { useCallback, useRef } from "react";
import type { ECElementEvent, ElementEvent } from "echarts/core";
import type { DataSourceValue } from "./ChartSeries";
import type { ColumnMap } from "@vuu-ui/vuu-utils";

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

/**
 * Distance, in pixels, the pointer can move over the chart after a context
 * menu opens before the menu is closed. The menu opens at the pointer, so
 * reaching it may cross a few pixels of the chart.
 */
const CLOSE_MENU_DISTANCE = 8;

export const useChartContextMenu = ({
  columnMap,
}: ChartContextMenuHookProps) => {
  const showContextMenu = useContextMenu();
  const hideContextMenu = useHideContextMenu();
  // client position at which the context menu was opened, while it is open
  const menuPositionRef = useRef<{ x: number; y: number } | undefined>(
    undefined,
  );

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

        const mouseEvent = event.event as MouseEvent;
        const onOpenChange = (open: boolean) => {
          if (!open) {
            menuPositionRef.current = undefined;
          }
        };

        const shown = showContextMenu(mouseEvent, "series", menuOptions, {
          onOpenChange,
        });
        if (shown) {
          menuPositionRef.current = {
            x: mouseEvent.clientX,
            y: mouseEvent.clientY,
          };
        }
      }
    },
    [columnMap, showContextMenu],
  );

  // Close the menu once the pointer moves away over the chart, the menu
  // relates to the data point under the pointer when it was opened.
  const onMouseMove = useCallback(
    ({ event }: ElementEvent) => {
      const menuPosition = menuPositionRef.current;
      if (menuPosition) {
        const { clientX, clientY } = event as MouseEvent;
        const distance = Math.hypot(
          clientX - menuPosition.x,
          clientY - menuPosition.y,
        );
        if (distance > CLOSE_MENU_DISTANCE) {
          menuPositionRef.current = undefined;
          hideContextMenu();
        }
      }
    },
    [hideContextMenu],
  );

  return { onContextMenu, onMouseMove };
};
