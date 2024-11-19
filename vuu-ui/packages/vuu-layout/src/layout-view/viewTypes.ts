import {
  CSSProperties,
  FunctionComponent,
  HTMLAttributes,
  ReactElement,
} from "react";
import { HeaderProps } from "../layout-header";
import {
  MaximizeAction,
  CollapseAction,
  ExpandAction,
  MousedownViewAction,
  QueryAction,
  RemoveAction,
  RestoreAction,
  TearoutAction,
} from "../layout-reducer";
import { ViewBroadcastMessage } from "./useViewBroadcastChannel";

export type SaveAction = {
  type: "save";
};

export type ContributionLocation = "post-title" | "pre-title";

export type Contribution = {
  index?: number;
  location?: ContributionLocation;
  content: ReactElement;
};

export type AddToolbarContributionViewAction = {
  content: ReactElement;
  location: ContributionLocation;
  type: "add-toolbar-contribution";
};

export type RemoveToolbarContributionViewAction = {
  location: ContributionLocation;
  type: "remove-toolbar-contribution";
};

export type BroadcastMessageViewAction = {
  type: "broadcast-message";
  message: ViewBroadcastMessage;
};

export type ViewAction =
  | BroadcastMessageViewAction
  | MaximizeAction
  | CollapseAction
  | ExpandAction
  | MousedownViewAction
  | QueryAction
  | RemoveAction
  | RestoreAction
  | TearoutAction
  | AddToolbarContributionViewAction
  | RemoveToolbarContributionViewAction;

export type ResizeStrategy = "defer" | "responsive";

export interface ViewProps extends HTMLAttributes<HTMLDivElement> {
  Header?: FunctionComponent<HeaderProps>;
  allowRename?: boolean;
  closeable?: boolean;
  collapsed?: boolean;
  "data-path"?: string;
  "data-resizeable"?: boolean;
  dropTargets?: string[];
  expanded?: boolean;
  flexFill?: boolean;
  header?: boolean | Partial<HeaderProps>;
  onCollapse?: () => void;
  onExpand?: () => void;
  orientation?: "vertical" | "horizontal";
  path?: string;
  resize?: ResizeStrategy;
  resizeable?: boolean;
  restoreStyle?: CSSProperties;
  tearOut?: boolean;
}
