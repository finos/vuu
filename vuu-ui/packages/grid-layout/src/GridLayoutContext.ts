import { createContext, Dispatch, DragEvent, useContext } from "react";
import { GridLayoutDragEndHandler } from "./GridLayoutProvider";
import { GridModel, TabStateTab, TrackSize } from "./GridModel";
import { GridLayoutDragStartHandler } from "./useDraggable";
import { GridLayoutModel } from "./GridLayoutModel";
import { GridLayoutDropPosition } from "@finos/vuu-utils";

export type GridLayoutActionType = "close";

export type GridLayoutCloseAction = {
  type: "close";
  id: string;
};

//TODO is it used ?
export type GridLayoutInsertTabAction = {
  type: "insert-tab";
  id: string;
  childId: string;
};

//TODO NOT USED
export type GridLayoutSwitchTabAction = {
  type: "switch-tab";
  fromId: string;
  toId: string;
};

export type GridLayoutTrackAction = {
  type: "resize-grid-column" | "resize-grid-row";
  trackIndex: number;
  value: TrackSize;
};

export type GridLayoutAction =
  | GridLayoutCloseAction
  | GridLayoutInsertTabAction
  | GridLayoutSwitchTabAction
  | GridLayoutTrackAction;

export type GridLayoutDispatch = Dispatch<GridLayoutAction>;
const unconfiguredGridLayoutDispatch: GridLayoutDispatch = (action) =>
  console.log(
    `dispatch ${action.type}, have you forgotten to provide a GridLayoutProvider ?`,
  );

/**
 * provides details of a dragged component within a stack
 */
export interface TabbedComponentDragSource {
  element: HTMLElement;
  isSelectedTab: boolean;
  layoutId: string;
  tab: TabStateTab;
  /** deprecated */
  tabIndex: number;
  tabsId: string;
  type: "tabbed-component";
}
/**
 * provides details of a dragged component
 */
export interface ComponentDragSource {
  element: HTMLElement;
  dragElement?: HTMLElement;
  id: string;
  label: string;
  layoutId: string;
  type: "component";
}

/**
 * provides details of a template, to be used on drop to instantiate  a new component
 */
export interface TemplateDragSource {
  componentJson: string;
  element: HTMLElement;
  layoutId: string;
  label: string;
  type: "template";
}

export type DragSourceProvider = (evt: DragEvent<Element>) => DragSource;

export type DragSource =
  | ComponentDragSource
  | TemplateDragSource
  | TabbedComponentDragSource;

export const sourceIsComponent = (
  source: DragSource | undefined,
): source is ComponentDragSource => {
  if (source === undefined) {
    throw Error("sourceIsComponent: source is undefined");
  }
  return source.type === "component";
};

export const sourceIsTabbedComponent = (
  source: DragSource | undefined,
): source is TabbedComponentDragSource => {
  if (source === undefined) {
    throw Error("sourceIsComponent: source is undefined");
  }
  return source.type === "tabbed-component";
};

export const sourceIsTemplate = (
  source: DragSource | undefined,
): source is TemplateDragSource => {
  if (source === undefined) {
    throw Error("sourceIsTemplate: source is undefined");
  }
  return source.type === "template";
};

export type GridLayoutDropHandler = (
  targetId: string,
  dragSource: DragSource,
  position: GridLayoutDropPosition,
) => void;

export interface GridLayoutContextProps {
  dispatchGridLayoutAction: GridLayoutDispatch;
  gridLayoutModel?: GridLayoutModel;
  gridModel?: GridModel;
  id: string;
  onDragEnd?: GridLayoutDragEndHandler;
  onDragStart: GridLayoutDragStartHandler;
  onDrop: GridLayoutDropHandler;
}

export const GridLayoutContext = createContext<GridLayoutContextProps>({
  dispatchGridLayoutAction: unconfiguredGridLayoutDispatch,
  id: "",
  onDragStart: () => console.log("no GridLayoutProvider"),
  onDrop: () => console.log("no GridLayoutProvider"),
});

export const useGridLayoutDispatch = () => {
  const { dispatchGridLayoutAction } = useContext(GridLayoutContext);
  return dispatchGridLayoutAction;
};

export const useGridLayoutDropHandler = () => {
  const { onDrop } = useContext(GridLayoutContext);
  return onDrop;
};

export const useGridLayoutDragEndHandler = () => {
  const { onDragEnd } = useContext(GridLayoutContext);
  return onDragEnd;
};

export const useGridLayoutDragStartHandler = () => {
  const { onDragStart } = useContext(GridLayoutContext);
  return onDragStart;
};

export const useGridModel = () => {
  const { gridModel } = useContext(GridLayoutContext);
  if (gridModel) {
    return gridModel;
  } else {
    throw Error(
      "[useGridModel] no gridModel, did you forget to use a GridLayout",
    );
  }
};

export const useGridLayoutId = () => {
  const { id } = useContext(GridLayoutContext);
  return id;
};
