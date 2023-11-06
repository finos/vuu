import { ContextMenuItemDescriptor } from "@finos/vuu-data-types";

export type MenuOptions = { [key: string]: unknown };

export interface TabMenuOptions {
  tabIndex: number;
}

export const isTabMenuOptions = (options: unknown): options is TabMenuOptions =>
  typeof options === "object" &&
  options !== null &&
  "tabIndex" in options &&
  typeof options.tabIndex === "number";

export const closeCommand = (options?: MenuOptions) =>
  ({
    label: `Close`,
    location: "tab",
    action: `close-tab`,
    options,
  } as ContextMenuItemDescriptor);

export const renameCommand = (options?: MenuOptions) =>
  ({
    label: `Rename`,
    location: "tab",
    action: `rename-tab`,
    options,
  } as ContextMenuItemDescriptor);
