import { HTMLAttributes } from "react";
import { HeaderProps } from "../layout-header";
import {
  AddToolbarContributionViewAction, MaximizeAction,
  MinimizeAction,
  MousedownViewAction,
  RemoveAction, RemoveToolbarContributionViewAction, RestoreAction,
  TearoutAction
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

export interface ViewProps extends HTMLAttributes<HTMLDivElement> {
  closeable?: boolean;
  collapsed?: boolean;
  "data-resizeable"?: boolean;
  dropTargets?: string[];
  expanded?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  flexFill?: any;
  header?: boolean | Partial<HeaderProps>;
  orientation?: "vertical" | "horizontal";
  path?: string;
  resize?: "defer" | "responsive";
  resizeable?: boolean;
  tearOut?: boolean;
}
