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

type EChartContextMenuHandlerParams = {
  dataIndex: number;
  event: EChartContextMenuEvent;
  name: string;
  seriesId: string;
  seriesName: string;
  value: number;
};

interface ChartContextMenuHookProps {
  allowContextMenu?: boolean;
  categoryColumnName: string;
  dataSource: DataSource;
}

export const useChartContextMenu = ({
  categoryColumnName,
}: ChartContextMenuHookProps) => {
  const showContextMenu = useContextMenu();

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  const onContextMenu = useCallback<any>(
    ({
      // dataIndex,
      event,
      name: categoryValue,
      // seriesId,
      seriesName: valueColumn,
      value,
      // ...params
    }: EChartContextMenuHandlerParams) => {
      event.stop();
      // console.log(
      //   `on context menu [${dataIndex}] #${seriesId} ${categoryColumnName} = ${categoryValue}, ${valueColumn} = ${value}`,
      //   {
      //     params,
      //   },
      // );
      const menuOptions: ChartContextMenuOptions = {
        categoryColumn: categoryColumnName,
        categoryValue,
        valueColumn,
        value,
      };

      showContextMenu(event.event, "chart", menuOptions, {
        onOpenChange: (isOpen: boolean) => {
          console.log(`[useTableContextMenu] onOpenChange ${isOpen}`);
        },
      });
    },
    [categoryColumnName, showContextMenu],
  );

  return onContextMenu;
};
