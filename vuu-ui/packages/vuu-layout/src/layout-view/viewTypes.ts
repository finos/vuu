import { FunctionComponent, HTMLAttributes } from "react";
import { HeaderProps } from "../layout-header";
import {
  AddToolbarContributionViewAction,
  MaximizeAction,
  MinimizeAction,
  MousedownViewAction,
  RemoveAction,
  RemoveToolbarContributionViewAction,
  RestoreAction,
  TearoutAction,
} from "../layout-reducer";

export type ViewAction =
  | MaximizeAction
  | MinimizeAction
  | MousedownViewAction
  | RemoveAction
  | RestoreAction
  | TearoutAction
  | AddToolbarContributionViewAction
  | RemoveToolbarContributionViewAction;

export type ResizeStrategy = "defer" | "responsive";

export interface ViewProps extends HTMLAttributes<HTMLDivElement> {
  Header?: FunctionComponent<HeaderProps>;
  closeable?: boolean;
  collapsed?: boolean;
  "data-resizeable"?: boolean;
  dropTargets?: string[];
  expanded?: boolean;
  flexFill?: boolean;
  header?: boolean | Partial<HeaderProps>;
  orientation?: "vertical" | "horizontal";
  path?: string;
  resize?: ResizeStrategy;
  resizeable?: boolean;
  tearOut?: boolean;
}
