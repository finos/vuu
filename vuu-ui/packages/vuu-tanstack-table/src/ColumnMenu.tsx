import { IconButton } from "@vuu-ui/vuu-ui-controls";
import {
  Menu,
  MenuItem,
  MenuItemProps,
  MenuPanel,
  MenuTrigger,
} from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";

import { DataSourceRow } from "@vuu-ui/vuu-data-types";
import { type Column as TanstackColumn } from "@tanstack/react-table";
import { MouseEventHandler, ReactElement, useCallback } from "react";
import columnMenuCss from "./ColumnMenu.css";
import { useData } from "./DataProvider";
import { isAccessorKeyColumnDef } from "./vuu-tanstack-utils";

export type ShowFiltersAction = {
  type: "show-inline-filters";
};

export type ColumnAction = ShowFiltersAction;
export type ColumnActionHandler = (action: ColumnAction) => void;
export interface ColumnMenuProps {
  allowGrouping?: boolean;
  allowHide?: boolean;
  allowInlineFilters?: boolean;
  allowSort?: boolean;
  column: TanstackColumn<DataSourceRow, unknown>;
  onColumnAction: ColumnActionHandler;
}

export const ColumnMenu = ({
  allowGrouping,
  allowHide,
  allowInlineFilters,
  allowSort,
  column,
  onColumnAction,
}: ColumnMenuProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-tab-menu",
    css: columnMenuCss,
    window: targetWindow,
  });

  const columnName = isAccessorKeyColumnDef(column.columnDef)
    ? column.columnDef.accessorKey
    : undefined;

  console.log({ columnName });

  const { dataSource } = useData();

  const columnHeader = column.columnDef.header;

  const handleMenuAction = useCallback<MouseEventHandler<HTMLDivElement>>(
    (e) => {
      e.stopPropagation();
      const { action } = (e.target as HTMLElement).dataset;
      console.log(`useMenuAction ${action}`);

      switch (action) {
        case "group":
          {
            if (typeof columnName === "string") {
              dataSource.groupBy = [columnName];
            } else {
              console.warn(
                `[ColumnMenu] group operation requires that ColumnDef defines accessorKey`,
              );
            }
          }
          break;
        case "hide":
          {
            column.toggleVisibility();
          }
          break;
        case "inline-filters":
          {
            onColumnAction?.({ type: "show-inline-filters" });
            // column.toggleVisibility();
          }
          break;
        default:
          console.log(`unexpected action ${action}`);
      }
    },
    [column, columnName, dataSource, onColumnAction],
  );

  const getMenuItems = () => {
    const menuItems: ReactElement<MenuItemProps>[] = [];

    if (allowSort) {
      menuItems.push(
        <MenuItem key="sort" onClick={handleMenuAction} data-action="sort">
          {`Sort by ${columnHeader}`}
        </MenuItem>,
      );
    }

    if (allowGrouping) {
      menuItems.push(
        <MenuItem key="group" onClick={handleMenuAction} data-action="group">
          {`Group by ${columnHeader}`}
        </MenuItem>,
      );
    }

    if (allowHide) {
      menuItems.push(
        <MenuItem key="hide" onClick={handleMenuAction} data-action="hide">
          Hide Column
        </MenuItem>,
      );
    }

    if (allowInlineFilters) {
      menuItems.push(
        <MenuItem
          key="inline-filters"
          onClick={handleMenuAction}
          data-action="inline-filters"
        >
          Show Inline Filters
        </MenuItem>,
      );
    }

    return menuItems;
  };

  return (
    <Menu>
      <MenuTrigger>
        <IconButton
          appearance="transparent"
          aria-label="Column Settings"
          className="ColumnMenuButton"
          data-embedded
          icon="more-vert"
          onClick={(e) => e.stopPropagation()}
          sentiment="neutral"
        />
      </MenuTrigger>
      <MenuPanel>{...getMenuItems()}</MenuPanel>
    </Menu>
  );
};
