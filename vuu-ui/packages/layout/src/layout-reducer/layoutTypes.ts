import { ReactElement } from 'react';
import { DropTarget } from '../drag-drop/DropTarget';

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
  props?: any;
  state?: any;
}

export interface WithActive {
  active?: number;
}

export type LayoutModel = LayoutRoot | ReactElement | WithType;

export type layoutType = 'Flexbox' | 'View' | 'DraggableLayout' | 'Stack';

export const LayoutActionType = {
  ADD: 'add',
  DRAG_DROP: 'drag-drop',
  MAXIMIZE: 'maximize',
  REMOVE: 'remove',
  REPLACE: 'replace',
  SAVE: 'save',
  SET_TITLE: 'set-title',
  SPLITTER_RESIZE: 'splitter-resize',
  SWITCH_TAB: 'switch-tab'
} as const;

export type AddAction = {
  component: any;
  path: string;
  type: typeof LayoutActionType.ADD;
};

export type DragDropAction = {
  draggedReactElement: ReactElement;
  dragInstructions: any;
  dropTarget: DropTarget;
  type: typeof LayoutActionType.DRAG_DROP;
};

export type MaximizeAction = {
  path: string;
  type: typeof LayoutActionType.MAXIMIZE;
};
export type RemoveAction = {
  path: string;
  type: typeof LayoutActionType.REMOVE;
};
export type ReplaceAction = {
  replacement: any;
  target: any;
  type: typeof LayoutActionType.REPLACE;
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
export type SwitchTabAction = {
  nextIdx: number;
  path: string;
  type: typeof LayoutActionType.SWITCH_TAB;
};

export type LayoutReducerAction =
  | AddAction
  | DragDropAction
  | MaximizeAction
  | RemoveAction
  | ReplaceAction
  | SetTitleAction
  | SplitterResizeAction
  | SwitchTabAction;

export type SaveAction = {
  type: typeof LayoutActionType.SAVE;
};
