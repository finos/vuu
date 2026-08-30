import { ContextMenuItemDescriptor } from "@vuu-ui/vuu-context-menu";

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
    id: `close-tab`,
    options,
  }) as ContextMenuItemDescriptor;

export const renameCommand = (options?: MenuOptions) =>
  ({
    label: `Rename`,
    location: "tab",
    id: `rename-tab`,
    options,
  }) as ContextMenuItemDescriptor;
