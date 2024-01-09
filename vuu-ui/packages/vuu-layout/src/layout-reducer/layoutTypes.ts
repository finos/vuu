/* eslint-disable @typescript-eslint/no-explicit-any */
import { NamedFilter } from "@finos/vuu-filter-types";
import { CSSProperties, ReactElement } from "react";
import { DragDropRect, DragInstructions } from "../drag-drop";
import { DropTarget } from "../drag-drop/DropTarget";
import { ContributionLocation } from "../layout-view";

export interface WithProps {
  props?: { [key: string]: any };
}

export interface WithType {
  props?: any;
  title?: string;
  type: string;
}

export interface LayoutRoot extends WithProps {
  active?: number;
  children?: ReactElement[];
  type: string;
}

export type ValueOf<T> = T[keyof T];
export interface ApplicationSettings {
  leftNav?: {
    activeTabIndex: number;
    expanded: boolean;
  };
  /**
   * filters are keyed by MODULE:tablename
   */
  filters?: { [key: string]: NamedFilter[] };
}
export type ApplicationSetting = ValueOf<ApplicationSettings>;

export interface ApplicationJSON {
  applicationLayout: LayoutJSON;
  settings?: ApplicationSettings;
}

export interface LayoutJSON extends WithType {
  active?: number;
  children?: LayoutJSON[];
  id?: string;
  props?: { [key: string]: any };
  state?: any;
  type: string;
  style?: CSSProperties;
}

export interface WithActive {
  active?: number;
}

export type LayoutModel = LayoutRoot | ReactElement | WithType;

export type layoutType = "Flexbox" | "View" | "DraggableLayout" | "Stack";

// TODO duplicated in layout-action
export const LayoutActionType = {
  ADD: "add",
  DRAG_START: "drag-start",
  DRAG_DROP: "drag-drop",
  LAYOUT_RESIZE: "layout-resize",
  MAXIMIZE: "maximize",
  MINIMIZE: "minimize",
  MOVE_CHILD: "move-child",
  QUERY: "query",
  REMOVE: "remove",
  REPLACE: "replace",
  RESTORE: "restore",
  SAVE: "save",
  SET_PROP: "set-prop",
  SET_PROPS: "set-props",
  SET_TITLE: "set-title",
  SPLITTER_RESIZE: "splitter-resize",
  SWITCH_TAB: "switch-tab",
  TEAROUT: "tearout",
} as const;

export type AddAction = {
  component: any;
  path: string;
  type: typeof LayoutActionType.ADD;
};

export type DragDropAction = {
  draggedReactElement: ReactElement;
  dragInstructions: any;
  dropTarget: Partial<DropTarget>;
  type: typeof LayoutActionType.DRAG_DROP;
};

export type MaximizeAction = {
  path?: string;
  type: typeof LayoutActionType.MAXIMIZE;
};

export type MinimizeAction = {
  path?: string;
  type: typeof LayoutActionType.MINIMIZE;
};

export type MoveChildAction = {
  fromIndex: number;
  toIndex: number;
  path: string;
  type: typeof LayoutActionType.MOVE_CHILD;
};

export type QueryAction = {
  path?: string;
  query: string;
  type: typeof LayoutActionType.QUERY;
};

export type RemoveAction = {
  path?: string;
  type: typeof LayoutActionType.REMOVE;
};

export type ReplaceAction = {
  replacement: any;
  target: any;
  type: typeof LayoutActionType.REPLACE;
};

export type RestoreAction = {
  path?: string;
  type: typeof LayoutActionType.RESTORE;
};

export type SetPropAction = {
  path: string;
  propName: string;
  propValue: string | number | boolean;
  type: typeof LayoutActionType.SET_PROP;
};

export type SetPropsAction = {
  path: string;
  props: { [key: string]: unknown };
  type: typeof LayoutActionType.SET_PROPS;
};

export type SetTitleAction = {
  path: string;
  title: string;
  type: typeof LayoutActionType.SET_TITLE;
};

export type SplitterResizeAction = {
  path: string;
  sizes: { currentSize: number; flexBasis: number }[];
  type: typeof LayoutActionType.SPLITTER_RESIZE;
};

export type LayoutResizeAction = {
  path: string;
  size: number;
  type: typeof LayoutActionType.LAYOUT_RESIZE;
};

export type SwitchTabAction = {
  id?: string;
  nextIdx: number;
  path: string;
  type: typeof LayoutActionType.SWITCH_TAB;
};

export type TearoutAction = {
  path?: string;
  type: typeof LayoutActionType.TEAROUT;
};

export type LayoutReducerAction =
  | AddAction
  | DragDropAction
  | LayoutResizeAction
  | MaximizeAction
  | MinimizeAction
  | MoveChildAction
  | RemoveAction
  | ReplaceAction
  | RestoreAction
  | SetPropAction
  | SetPropsAction
  | SetTitleAction
  | SplitterResizeAction
  | SwitchTabAction;

export type SaveAction = {
  type: typeof LayoutActionType.SAVE;
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

export type MousedownViewAction = {
  preDragActivity?: any;
  index?: number;
  type: "mousedown";
};

export type DragStartAction = {
  payload?: ReactElement;
  dragContainerPath?: string;
  dragElement?: HTMLElement;
  dragRect: DragDropRect;
  dropTargets?: string[];
  evt: MouseEvent;
  instructions?: DragInstructions;
  path: string;
  type: typeof LayoutActionType.DRAG_START;
};

export type LayoutLevelChange =
  | "switch-active-tab"
  | "edit-feature-title"
  | "save-feature-props"
  | "resize-component"
  | "remove-component"
  | "drag-drop-operation";

export type ApplicationLevelChange =
  | "switch-active-layout"
  | "open-layout"
  | "close-layout"
  | "rename-layout"
  | "resize-application-chrome";

export type LayoutChangeReason = LayoutLevelChange | ApplicationLevelChange;

export type LayoutChangeHandler = (
  layout: LayoutJSON,
  layoutChangeReason: LayoutChangeReason
) => void;

export const isApplicationLevelChange = (
  layoutChangeReason: LayoutChangeReason
): layoutChangeReason is ApplicationLevelChange =>
  [
    "switch-active-layout",
    "open-layout",
    "close-layout",
    "rename-layout",
  ].includes(layoutChangeReason);

export const isLayoutLevelChange = (
  layoutChangeReason: LayoutChangeReason
): layoutChangeReason is LayoutLevelChange =>
  [
    "switch-active-tab",
    "edit-feature-title",
    "save-feature-props",
    "remove-component",
    "resize-component",
    "drag-drop-operation",
  ].includes(layoutChangeReason);
