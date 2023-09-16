import { buildColumnMap } from "@finos/vuu-utils";
import { DataSourceRow } from "@finos/vuu-data-types";
import { KeyedColumnDescriptor } from "@finos/vuu-datagrid-types";
import { MouseEvent, useCallback } from "react";
import { useContextMenu as usePopupContextMenu } from "@finos/vuu-popups";

export interface TableContextMenuHookProps {
  columns: KeyedColumnDescriptor[];
  data: DataSourceRow[];
}

export const useTableContextMenu = ({
  columns,
  data,
}: TableContextMenuHookProps) => {
  const [showContextMenu] = usePopupContextMenu();

  const onContextMenu = useCallback(
    (evt: MouseEvent<HTMLElement>) => {
      // const { current: currentData } = dataRef;
      // const { current: currentDataSource } = dataSourceRef;
      const target = evt.target as HTMLElement;
      const cellEl = target?.closest("div[role='cell']");
      const rowEl = target?.closest("div[role='row']");
      if (cellEl && rowEl /*&& currentData && currentDataSource*/) {
        //   const { columns, selectedRowsCount } = currentDataSource;
        const columnMap = buildColumnMap(columns);
        const rowIndex = parseInt(rowEl.ariaRowIndex ?? "-1");
        const cellIndex = Array.from(rowEl.childNodes).indexOf(cellEl);
        const row = data.find(([idx]) => idx === rowIndex);
        const columnName = columns[cellIndex];
        showContextMenu(evt, "grid", {
          columnMap,
          columnName,
          row,
          // selectedRows: selectedRowsCount === 0 ? NO_ROWS : getSelectedRows(),
          // viewport: dataSource?.viewport,
        });
      }
    },
    [columns, data, showContextMenu]
  );

  return onContextMenu;
};
