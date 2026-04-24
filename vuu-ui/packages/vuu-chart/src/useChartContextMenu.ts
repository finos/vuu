import { useContextMenu } from "@vuu-ui/vuu-context-menu";
import { DataSource } from "@vuu-ui/vuu-data-types";
import { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import { useCallback } from "react";

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
  valueColumn: string;
  value: VuuRowDataItemType;
};

export type EChartContextMenuHandlerParams = {
  dataIndex: number;
  event: EChartContextMenuEvent;
  name: string;
  seriesId: string;
  seriesName: string;
  value: number;
};

export interface ChartContextMenuHookProps {
  allowContextMenu?: boolean;
  categoryColumnName?: string;
  dataSource: DataSource;
}

export const useChartContextMenu = ({
  categoryColumnName,
  dataSource,
}: ChartContextMenuHookProps) => {
  const showContextMenu = useContextMenu();

  const onContextMenu = useCallback(
    ({
      dataIndex,
      event,
      name: categoryValue,
      seriesId,
      seriesName: valueColumn,
      value,
      ...params
    }: EChartContextMenuHandlerParams) => {
      event.stop();
      console.log(
        `on context menu [${dataIndex}] #${seriesId} ${categoryColumnName} = ${categoryValue}, ${valueColumn} = ${value}`,
        {
          params,
        },
      );

      //   const menuOptions: ChartContextMenuOptions = {
      //     categoryColumn,
      //     categoryValue,
      //     valueColumn,
      //   };
    },
    [],
  );

  return onContextMenu;
};
