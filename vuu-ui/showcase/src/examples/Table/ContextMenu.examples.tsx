import {
  TableContextMenuDef,
  TableContextMenuOptions,
  TableMenuLocation,
} from "@vuu-ui/vuu-table-types";
import { SimulTable } from "./SimulTableTemplate";
import { MenuActionHandler, MenuBuilder } from "@vuu-ui/vuu-context-menu";
import { useCallback } from "react";

const useLocalContextMenu = (): TableContextMenuDef => {
  const menuBuilder: MenuBuilder<TableMenuLocation, TableContextMenuOptions> =
    useCallback((_location, options) => {
      return [{ id: "cell-copy", label: "Copy text", options }];
    }, []);

  const menuActionHandler = useCallback<
    MenuActionHandler<string, TableContextMenuOptions>
  >((menuItemId, options) => {
    if (options) {
      const { column, columnMap, row } = options;
      switch (menuItemId) {
        case "cell-copy": {
          const colIdx = columnMap[column.name];
          const value = row[colIdx];
          navigator.clipboard.writeText(`${value}`);
          return true;
        }

        default:
          return false;
      }
    } else {
      return false;
    }
  }, []);

  return {
    menuBuilder,
    menuActionHandler,
  };
};

export const LocalContextMenu = () => {
  return (
    <SimulTable
      tableName="instruments"
      tableContextMenuHook={useLocalContextMenu}
    />
  );
};
