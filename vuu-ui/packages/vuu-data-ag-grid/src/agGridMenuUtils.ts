import {
  ContextMenuItemDescriptor,
  isGroupMenuItemDescriptor,
} from "@finos/vuu-popups";

export interface AgGridMenuDescriptor {
  action: () => void;
  name: string;
  subMenu?: AgGridMenuDescriptor[];
}

export const vuuMenuToAgGridMenu =
  (actionHandler: () => void) =>
  (menuOption: ContextMenuItemDescriptor): AgGridMenuDescriptor => {
    return {
      action: actionHandler,
      name: menuOption.label,
      subMenu: isGroupMenuItemDescriptor(menuOption)
        ? menuOption.children.map(vuuMenuToAgGridMenu(actionHandler))
        : undefined,
    };
  };
