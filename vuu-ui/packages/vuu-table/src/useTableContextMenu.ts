import { DataSource, DataSourceRow } from "@vuu-ui/vuu-data-types";
import { RuntimeColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { useContextMenu as usePopupContextMenu } from "@vuu-ui/vuu-popups";
import { buildColumnMap } from "@vuu-ui/vuu-utils";
import { getAriaColIndex, getAriaRowIndex } from "./table-dom-utils";
import { MouseEvent, useCallback } from "react";

export interface TableContextMenuHookProps {
  columns: RuntimeColumnDescriptor[];
  data: DataSourceRow[];
  dataSource: DataSource;
  getSelectedRows: () => DataSourceRow[];
  // TODO can we eliminate this it is only needed to convert aria row index to actual row index
  headerCount: number;
}

const NO_ROWS = [] as const;

export const useTableContextMenu = ({
  columns,
  data,
  dataSource,
  getSelectedRows,
  headerCount,
}: TableContextMenuHookProps) => {
  const [showContextMenu] = usePopupContextMenu();

  const onContextMenu = useCallback(
    (evt: MouseEvent<HTMLElement>) => {
      const target = evt.target as HTMLElement;
      const cellEl = target?.closest<HTMLElement>("div[role='cell']");
      const rowEl = target?.closest<HTMLElement>("div[role='row']");
      if (cellEl && rowEl) {
        const { selectedRowsCount } = dataSource;
        const columnMap = buildColumnMap(columns);
        const rowIndex = getAriaRowIndex(rowEl) - headerCount - 1;
        const cellIndex = getAriaColIndex(cellEl) - 1;
        const row = data.find(([idx]) => idx === rowIndex);
        const columnName = columns[cellIndex];
        // TODO does it really make sense to collect selected rows ?
        // We only have access to rows in local cache
        showContextMenu(evt, "grid", {
          columnMap,
          columnName,
          columns,
          row,
          selectedRows: selectedRowsCount === 0 ? NO_ROWS : getSelectedRows(),
          viewport: dataSource.viewport,
        });
      }
    },
    [columns, data, dataSource, getSelectedRows, headerCount, showContextMenu],
  );

  return onContextMenu;
};
