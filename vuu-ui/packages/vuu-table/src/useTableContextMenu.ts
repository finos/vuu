import { useContextMenu } from "@vuu-ui/vuu-context-menu";
import { DataSource, DataSourceRow } from "@vuu-ui/vuu-data-types";
import {
  ColumnDescriptor,
  TableContextMenuOptions,
  TableMenuLocation,
} from "@vuu-ui/vuu-table-types";
import { buildColumnMap, isTypeDescriptor } from "@vuu-ui/vuu-utils";
import { MouseEvent, useCallback } from "react";
import { getAriaColIndex, getAriaRowIndex } from "./table-dom-utils";

export interface TableContextMenuHookProps {
  allowContextMenu?: boolean;
  columns: ColumnDescriptor[];
  data: DataSourceRow[];
  dataSource: DataSource;
  getSelectedRows: () => DataSourceRow[];
  // TODO can we eliminate this it is only needed to convert aria row index to actual row index
  headerCount?: number;
}

const NO_ROWS: DataSourceRow[] = [] as const;

export const isTableLocation = (
  location: string,
): location is TableMenuLocation =>
  ["grid", "header", "filter"].includes(location);

const getDataSourceRow = (rows: DataSourceRow[], rowIndex: number) => {
  const row = rows.find(([idx]) => idx === rowIndex);
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
  data,
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
        const [firstColumn] = columns;
        const hasCheckBox =
          firstColumn?.isSystemColumn &&
          isTypeDescriptor(firstColumn?.type) &&
          firstColumn.type.name === "checkbox";
        const { selectedRowsCount } = dataSource;
        const columnMap = buildColumnMap(columns);
        const rowIndex = getAriaRowIndex(rowEl) - headerCount - 1;
        const ariaColIndex = getAriaColIndex(cellEl);
        const cellIndex = hasCheckBox ? ariaColIndex : ariaColIndex - 1;
        const row = getDataSourceRow(data, rowIndex);
        const column = columns[cellIndex];

        // TODO does it really make sense to collect selected rows ?
        // We only have access to rows in local cache
        const menuOptions: TableContextMenuOptions = {
          columnMap,
          column,
          columns,
          row,
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
    },
    [columns, data, dataSource, getSelectedRows, headerCount, showContextMenu],
  );

  return allowContextMenu ? onContextMenu : undefined;
};
