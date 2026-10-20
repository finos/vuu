import {
  TableContextMenuDef,
  TableContextMenuOptions,
  TableMenuLocation,
} from "@vuu-ui/vuu-table-types";
import { SimulTable } from "./SimulTableTemplate";
import { MenuActionHandler, MenuBuilder } from "@vuu-ui/vuu-context-menu";
import { createContext, useCallback, useContext, useState } from "react";

const useLocalContextMenu = (): TableContextMenuDef => {
  const menuBuilder: MenuBuilder<TableMenuLocation, TableContextMenuOptions> =
    useCallback((_location, options) => {
      return [{ id: "cell-copy", label: "Copy text", options }];
    }, []);

  const menuActionHandler = useCallback<
    MenuActionHandler<string, TableContextMenuOptions>
  >((menuItemId, options) => {
    if (options) {
      const { column, dataRow } = options;
      switch (menuItemId) {
        case "cell-copy": {
          const value = dataRow[column.name];
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

export const LocalContextMenuCheckboxes = () => {
  return (
    <SimulTable
      selectionModel="checkbox"
      tableName="instruments"
      tableContextMenuHook={useLocalContextMenu}
    />
  );
};

const MenuActionContext = createContext<(action: string) => void>(() => {});

const useNestedContextMenu = (): TableContextMenuDef => {
  const onMenuAction = useContext(MenuActionContext);
  const menuBuilder: MenuBuilder<TableMenuLocation, TableContextMenuOptions> =
    useCallback((_location, options) => {
      return [
        { id: "cell-copy", label: "Copy text", icon: "edit", options },
        {
          label: "Filter",
          children: [
            {
              id: "filter-include",
              label: "Include value",
              icon: "filter",
              options,
            },
            { id: "filter-exclude", label: "Exclude value", options },
          ],
        },
        {
          label: "Sort",
          children: [
            { id: "sort-asc", label: "Ascending", icon: "sorted-asc", options },
            {
              id: "sort-dsc",
              label: "Descending",
              icon: "sorted-dsc",
              options,
            },
          ],
        },
        {
          id: "cell-delete",
          label: "Delete row",
          disabled: true,
          options,
        },
      ];
    }, []);

  const menuActionHandler = useCallback<
    MenuActionHandler<string, TableContextMenuOptions>
  >(
    (menuItemId, options) => {
      if (options) {
        const { column, dataRow } = options;
        onMenuAction(`${menuItemId}:${column.name}:${dataRow[column.name]}`);
        return true;
      }
      return false;
    },
    [onMenuAction],
  );

  return {
    menuBuilder,
    menuActionHandler,
  };
};

/**
 * Context menu with icons, nested sub menus and a disabled item. The last
 * invoked menu action is displayed below the table (data-testid="menu-action").
 */
export const NestedContextMenu = () => {
  const [lastAction, setLastAction] = useState("");
  return (
    <MenuActionContext.Provider value={setLastAction}>
      <SimulTable
        height={500}
        tableName="instruments"
        tableContextMenuHook={useNestedContextMenu}
      />
      <div data-testid="menu-action">{lastAction}</div>
    </MenuActionContext.Provider>
  );
};
