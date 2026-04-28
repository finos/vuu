import { useContextMenu } from "@vuu-ui/vuu-context-menu";
import { DataSourceRow } from "@vuu-ui/vuu-data-types";
import { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import { useCallback } from "react";
import { DataSourceValue } from "./ChartSeries";

export type ChartMenuLocation = "canvas" | "series";

type EChartContextMenuEvent = {
  event: PointerEvent;
  offsetX: number;
  offsetY: number;
  stop: () => void;
  type: "contextmenu";
};

export type ChartContextMenuOptions = {
  categoryColumn: string;
  categoryValue: VuuRowDataItemType;
  row: DataSourceRow;
  valueColumn: string;
  value: VuuRowDataItemType;
};

type EChartContextMenuHandlerParams = {
  data: DataSourceValue;
  dataIndex: number;
  event: EChartContextMenuEvent;
  name: string;
  seriesId: string;
  seriesName: string;
  value: DataSourceValue;
};

interface ChartContextMenuHookProps {
  allowContextMenu?: boolean;
  categoryColumnName: string;
}

export const useChartContextMenu = ({
  categoryColumnName,
}: ChartContextMenuHookProps) => {
  const showContextMenu = useContextMenu();

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  const onContextMenu = useCallback<any>(
    ({
      data,
      event,
      name: categoryValue,
      seriesName: valueColumn,
      value: keyedValue,
      ...rest
    }: EChartContextMenuHandlerParams) => {
      event.stop();
      console.log({ rest });
      const { row, value } = data;

      const menuOptions: ChartContextMenuOptions = {
        categoryColumn: categoryColumnName,
        categoryValue,
        row,
        valueColumn,
        value,
      };

      showContextMenu(event.event, "series", menuOptions, {
        onOpenChange: (isOpen: boolean) => {
          console.log(`[useTableContextMenu] onOpenChange ${isOpen}`);
        },
      });
    },
    [categoryColumnName, showContextMenu],
  );

  return onContextMenu;
};
