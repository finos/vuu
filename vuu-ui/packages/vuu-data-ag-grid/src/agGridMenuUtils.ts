import {
  ContextMenuItemDescriptor,
  isGroupMenuItemDescriptor,
} from "@finos/vuu-popups";

export interface AgGridMenuDescriptor {
  action: () => void;
  name: string;
  subMenu?: AgGridMenuDescriptor[];
}

const noop = () => undefined;

export const vuuMenuToAgGridMenu =
  (actionHandler: (options: { [key: string]: unknown }) => void) =>
  (menuOption: ContextMenuItemDescriptor): AgGridMenuDescriptor => {
    const isGroupItem = isGroupMenuItemDescriptor(menuOption);
    return {
      action: isGroupItem
        ? noop
        : () => actionHandler(menuOption.options as { [key: string]: unknown }),
      name: menuOption.label,
      subMenu: isGroupItem
        ? menuOption.children.map(vuuMenuToAgGridMenu(actionHandler))
        : undefined,
    };
  };
