import {
  ContextMenuGroupItemDescriptor,
  ContextMenuItemDescriptor,
} from "@finos/vuu-data-types";

export const isGroupMenuItemDescriptor = (
  menuItem?: ContextMenuItemDescriptor
): menuItem is ContextMenuGroupItemDescriptor =>
  menuItem !== undefined && "children" in menuItem;
