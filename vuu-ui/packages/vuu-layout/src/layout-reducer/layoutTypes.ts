/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReactElement } from "react";
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

export interface LayoutJSON extends WithType {
  children?: LayoutJSON[];
  id?: string;
  props?: { [key: string]: any };
  state?: any;
  type: string;
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
  REMOVE: "remove",
  REPLACE: "replace",
  RESTORE: "restore",
  SAVE: "save",
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
  | RemoveAction
  | ReplaceAction
  | RestoreAction
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
