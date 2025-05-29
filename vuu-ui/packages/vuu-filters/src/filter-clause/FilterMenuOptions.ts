import { ContextMenuItemDescriptor } from "@vuu-ui/vuu-data-types";

export type MenuOptions = { [key: string]: unknown };

export const andCommand = (options?: MenuOptions) =>
  ({
    label: `Close`,
    location: "filter",
    action: `and-filter-clause`,
    options,
  }) as ContextMenuItemDescriptor;

export const orCommand = (options?: MenuOptions) =>
  ({
    label: `Rename`,
    location: "filter",
    action: `or-filter-clause`,
    options,
  }) as ContextMenuItemDescriptor;
