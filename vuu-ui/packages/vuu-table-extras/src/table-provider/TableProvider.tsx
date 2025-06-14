import { MenuActionHandler } from "@vuu-ui/vuu-context-menu";
import { DataSource } from "@vuu-ui/vuu-data-types";
import { createContext, ReactNode, useContext } from "react";
import { ColumnMenuActionType } from "../column-menu/column-menu-utils";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";

export interface TableContextProps {
  dataSource: DataSource;
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
}: TableContextProps & {
  children: ReactNode;
}) => {
  return (
    <TableContext.Provider value={{ dataSource, menuActionHandler }}>
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
    return { dataSource, menuActionHandler };
  }
}
