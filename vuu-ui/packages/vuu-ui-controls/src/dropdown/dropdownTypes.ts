import type { PopupComponentProps, PopupPlacement } from "@finos/vuu-popups";
import {
  HTMLAttributes,
  KeyboardEvent,
  ReactElement,
  Ref,
  RefObject,
} from "react";

export type DropdownOpenKey = "Enter" | "ArrowDown" | " ";

export type CloseReason =
  | "blur"
  | "Escape"
  | "click-away"
  | "select"
  | "script"
  | "Tab"
  | "toggle";
export type OpenChangeHandler = <T extends boolean>(
  open: T,
  closeReason?: T extends false ? CloseReason : never
) => void;

export interface DropdownBaseProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onSelect"> {
  PopupProps?: Pick<PopupComponentProps, "minWidth">;
  defaultIsOpen?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  isOpen?: boolean;
  onKeyDown?: (e: KeyboardEvent<HTMLElement>) => void;
  openKeys?: DropdownOpenKey[];
  onOpenChange?: OpenChangeHandler;
  openOnFocus?: boolean;
  placement?: PopupPlacement;
  popupWidth?: number;
  triggerComponent?: JSX.Element;
  width?: number | string;
}

export interface DropdownHookProps
  extends Pick<
    DropdownBaseProps,
    | "defaultIsOpen"
    | "disabled"
    | "fullWidth"
    | "isOpen"
    | "onOpenChange"
    | "onKeyDown"
    | "openKeys"
    | "openOnFocus"
    | "popupWidth"
    | "width"
  > {
  ariaLabelledBy?: string;
  id: string;
  popupComponent: ReactElement & { ref?: Ref<any> };
  rootRef: RefObject<HTMLDivElement>;
}

export interface DropdownHookTriggerProps {
  "aria-expanded"?: boolean;
  "aria-labelledby"?: string;
  "aria-owns"?: string;
  id: string;
  onClick?: (e: MouseEvent) => void;
  onFocus?: (e: FocusEvent) => void;
  role: string;
  onKeyDown?: (e: KeyboardEvent<HTMLElement>) => void;
  style?: any;
}

// We don't know what the popup component will be, but for those that
// support a width prop ...
interface ComponentProps extends HTMLAttributes<HTMLElement> {
  width?: number | string;
}

export interface DropdownHookResult {
  componentProps: ComponentProps;
  isOpen: boolean;
  label: string;
  popupComponentRef: React.Ref<HTMLElement>;
  triggerProps: DropdownHookTriggerProps;
}
