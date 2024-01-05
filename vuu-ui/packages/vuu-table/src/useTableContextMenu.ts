import { DataSource, DataSourceRow } from "@finos/vuu-data-types";
import { RuntimeColumnDescriptor } from "@finos/vuu-table-types";
import { useContextMenu as usePopupContextMenu } from "@finos/vuu-popups";
import { buildColumnMap, getIndexFromRowElement } from "@finos/vuu-utils";
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
      const target = evt.target as HTMLElement;
      const cellEl = target?.closest("div[role='cell']");
      const rowEl = target?.closest("div[role='row']") as HTMLElement;
      if (cellEl && rowEl) {
        const { selectedRowsCount } = dataSource;
        const columnMap = buildColumnMap(columns);
        const rowIndex = getIndexFromRowElement(rowEl);
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
