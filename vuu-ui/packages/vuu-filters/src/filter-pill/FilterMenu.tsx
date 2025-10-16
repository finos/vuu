import { Menu, MenuItem, MenuPanel, MenuProps } from "@salt-ds/core";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { ReactElement, useMemo } from "react";

export type FilterPermissions = {
  /** Closing a filter removes it from current display, without deleting*/
  allowClose?: boolean;
  /** Edit the details of the filter itself */
  allowEdit?: boolean;
  /** Rename the filter */
  allowRename?: boolean;
  /** Removing a filter deletes it entirely */
  allowRemove?: boolean;
};

const defaultPermissions: FilterPermissions = {
  allowClose: true,
  allowEdit: true,
  allowRename: true,
  allowRemove: true,
};

export type FilterMenuActionHandler = <T extends FilterAction = FilterAction>(
  filterId: string,
  filterAction: T,
  /**
   * Some menu action handlers may use columns to enrich filter display
   */
  columns?: ColumnDescriptor[],
) => void;

export interface FilterMenuProps
  extends Pick<MenuProps, "getVirtualElement" | "onOpenChange" | "open"> {
  filterId: string;
  onMenuAction: FilterMenuActionHandler;
  permissions?: FilterPermissions;
}

export type FilterAction = "close" | "remove" | "edit" | "rename";

export const FilterMenu = ({
  filterId,
  getVirtualElement,
  onMenuAction,
  onOpenChange,
  open,
  permissions = defaultPermissions,
}: FilterMenuProps) => {
  const {
    allowClose = defaultPermissions.allowClose,
    allowEdit = defaultPermissions.allowEdit,
    allowRename = defaultPermissions.allowRename,
    allowRemove = defaultPermissions.allowRemove,
  } = permissions;

  const menuItems = useMemo<ReactElement[]>(() => {
    const items: ReactElement[] = [];
    if (allowClose) {
      items.push(
        <MenuItem key="close" onClick={() => onMenuAction(filterId, "close")}>
          Close
        </MenuItem>,
      );
    }
    if (allowEdit) {
      items.push(
        <MenuItem key="edit" onClick={() => onMenuAction(filterId, "edit")}>
          Edit Filter
        </MenuItem>,
      );
    }
    if (allowRename) {
      items.push(
        <MenuItem key="rename" onClick={() => onMenuAction(filterId, "rename")}>
          Rename
        </MenuItem>,
      );
    }
    if (allowRemove) {
      items.push(
        <MenuItem key="delete" onClick={() => onMenuAction(filterId, "remove")}>
          Delete
        </MenuItem>,
      );
    }

    return items;
  }, [allowClose, allowEdit, allowRemove, allowRename, filterId, onMenuAction]);
  return (
    <Menu
      getVirtualElement={getVirtualElement}
      open={open}
      onOpenChange={onOpenChange}
    >
      <MenuPanel>{menuItems}</MenuPanel>
    </Menu>
  );
};
