import { DataSource } from "@finos/vuu-data";
import { DataSourceRow } from "@finos/vuu-data-types";
import { RuntimeColumnDescriptor } from "@finos/vuu-datagrid-types";
import { useContextMenu as usePopupContextMenu } from "@finos/vuu-popups";
import { buildColumnMap } from "@finos/vuu-utils";
import { MouseEvent, useCallback } from "react";

export interface TableContextMenuHookProps {
  columns: RuntimeColumnDescriptor[];
  data: DataSourceRow[];
  dataSource: DataSource;
  getSelectedRows: () => DataSourceRow[];
}

const NO_ROWS = [] as const;

export const useTableContextMenu = ({
  columns,
  data,
  dataSource,
  getSelectedRows,
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
        const { selectedRowsCount } = dataSource;
        const columnMap = buildColumnMap(columns);
        const rowIndex = parseInt(rowEl.ariaRowIndex ?? "-1");
        const cellIndex = Array.from(rowEl.childNodes).indexOf(cellEl);
        const row = data.find(([idx]) => idx === rowIndex);
        const columnName = columns[cellIndex];
        showContextMenu(evt, "grid", {
          columnMap,
          columnName,
          row,
          selectedRows: selectedRowsCount === 0 ? NO_ROWS : getSelectedRows(),
          viewport: dataSource.viewport,
        });
      }
    },
    [columns, data, dataSource, getSelectedRows, showContextMenu]
  );

  return onContextMenu;
};
