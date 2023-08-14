import { ContextMenuItemDescriptor } from "@finos/vuu-data-types";

export type MenuOptions = { [key: string]: unknown };

export interface FilterPillMenuOptions {
  tabIndex: number;
}

export const isFilterPillMenuOptions = (
  options: unknown
): options is FilterPillMenuOptions =>
  typeof options === "object" && options !== null && "filter" in options;

export const closeCommand = (options?: MenuOptions) =>
  ({
    label: `Close`,
    location: "filter",
    action: `close-filter`,
    options,
  } as ContextMenuItemDescriptor);

export const renameCommand = (options?: MenuOptions) =>
  ({
    label: `Rename`,
    location: "filter",
    action: `rename-filter`,
    options,
  } as ContextMenuItemDescriptor);
