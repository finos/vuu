import { useContextMenu } from "@vuu-ui/vuu-context-menu";
import { DataSource } from "@vuu-ui/vuu-data-types";
import {
  ColumnDescriptor,
  DataRow,
  RuntimeColumnDescriptor,
  TableContextMenuOptions,
  TableMenuLocation,
} from "@vuu-ui/vuu-table-types";
import {
  columnByAriaIndex,
  getAriaColIndex,
  getAriaRowIndex,
} from "@vuu-ui/vuu-utils";
import { MouseEvent, useCallback } from "react";

export interface TableContextMenuHookProps {
  allowContextMenu?: boolean;
  columns: ColumnDescriptor[];
  dataRows: DataRow[];
  dataSource: DataSource;
  getSelectedRows: () => DataRow[];
  // TODO can we eliminate this it is only needed to convert aria row index to actual row index
  headerCount?: number;
}

const NO_ROWS: DataRow[] = [] as const;

export const isTableLocation = (
  location: string,
): location is TableMenuLocation =>
  ["grid", "header", "filter"].includes(location);

const getDataSourceRow = (dataRows: DataRow[], rowIndex: number) => {
  const row = dataRows.find((dataRow) => dataRow.index === rowIndex);
  if (row) {
    return row;
  } else {
    throw Error(
      `useTableContextMenu data row not found for rowIndex ${rowIndex}`,
    );
  }
};

export const useTableContextMenu = ({
  allowContextMenu = true,
  columns,
  dataRows,
  dataSource,
  getSelectedRows,
  headerCount = 1,
}: TableContextMenuHookProps) => {
  const showContextMenu = useContextMenu();

  const onContextMenu = useCallback(
    (evt: MouseEvent<HTMLElement>) => {
      const target = evt.target as HTMLElement;
      const cellEl = target?.closest<HTMLElement>("div[role='cell']");
      const rowEl = target?.closest<HTMLElement>("div[role='row']");
      if (cellEl && rowEl) {
        const { selectedRowsCount } = dataSource;
        const rowIndex = getAriaRowIndex(rowEl) - headerCount - 1;
        const ariaColIndex = getAriaColIndex(cellEl);
        const dataRow = getDataSourceRow(dataRows, rowIndex);
        const column = columnByAriaIndex(
          columns as RuntimeColumnDescriptor[],
          ariaColIndex,
        );

        if (!column.isSystemColumn) {
          // TODO does it really make sense to collect selected rows ?
          // We only have access to rows in local cache
          const menuOptions: TableContextMenuOptions = {
            column,
            columns,
            dataRow,
            selectedRows: selectedRowsCount === 0 ? NO_ROWS : getSelectedRows(),
            viewport: dataSource.viewport,
          };

          const menuShowing = showContextMenu(evt, "grid", menuOptions, {
            onOpenChange: (isOpen: boolean) => {
              console.log(`[useTableContextMenu] onOpenChange ${isOpen}`);
              cellEl.classList.remove("ContextOpen");
            },
          });
          if (menuShowing) {
            cellEl.classList.add("ContextOpen");
          }
        }
      }
    },
    [
      columns,
      dataRows,
      dataSource,
      getSelectedRows,
      headerCount,
      showContextMenu,
    ],
  );

  return allowContextMenu ? onContextMenu : undefined;
};
