import type { MenuActionHandler } from "@vuu-ui/vuu-context-menu";
import type { DataSource } from "@vuu-ui/vuu-data-types";
import type { TableProps } from "@vuu-ui/vuu-table";
import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { createContext, ReactNode, useContext } from "react";
import type { ColumnMenuActionType } from "../column-menu/column-menu-utils";

export interface TableContextProps
  extends Pick<TableProps, "dataSource" | "rowActionHandlers"> {
  menuActionHandler: MenuActionHandler<ColumnMenuActionType, ColumnDescriptor>;
}

const NullMenuActionHandler = (menuItemId: string) => {
  console.log(
    `[TableContext] no menu action handler installed (menuItemHandler invoked with ${menuItemId})`,
  );
  return false;
};
const NullDataSource = {} as DataSource;

export const TableContext = createContext<TableContextProps>({
  dataSource: NullDataSource,
  menuActionHandler: NullMenuActionHandler,
});

export const TableProvider = ({
  children,
  dataSource,
  menuActionHandler,
  rowActionHandlers,
}: TableContextProps & {
  children: ReactNode;
}) => {
  return (
    <TableContext.Provider
      value={{
        dataSource,
        menuActionHandler,
        rowActionHandlers,
      }}
    >
      {children}
    </TableContext.Provider>
  );
};

export function useTableContext(throwIfNoDataSource = false) {
  const { dataSource, menuActionHandler } = useContext(TableContext);
  if (
    dataSource === NullDataSource &&
    menuActionHandler == NullMenuActionHandler &&
    throwIfNoDataSource
  ) {
    throw Error(`[TableProvider] no DataSourceProvider has been declared`);
  } else {
    return {
      dataSource,
      menuActionHandler,
    };
  }
}

export const useRowAction = (actionId: string) => {
  const { rowActionHandlers } = useContext(TableContext);
  if (rowActionHandlers?.[actionId]) {
    return rowActionHandlers[actionId];
  } else {
    throw Error(
      `[TableProvider] useRowAction, no action configured #${actionId}`,
    );
  }
};
