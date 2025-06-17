import { ContextMenuItemDescriptor } from "@vuu-ui/vuu-context-menu";

export type MenuOptions = { [key: string]: unknown };

export const andCommand = (options?: MenuOptions) =>
  ({
    label: `Close`,
    location: "filter",
    id: `and-filter-clause`,
    options,
  }) as ContextMenuItemDescriptor;

export const orCommand = (options?: MenuOptions) =>
  ({
    label: `Rename`,
    location: "filter",
    id: `or-filter-clause`,
    options,
  }) as ContextMenuItemDescriptor;
