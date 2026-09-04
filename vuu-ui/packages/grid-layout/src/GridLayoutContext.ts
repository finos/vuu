import {
  createContext,
  type Dispatch,
  type DragEvent,
  useContext,
} from "react";
import type { GridLayoutDragEndHandler } from "./GridLayoutProvider";
import type { GridModel, TabStateTab, TrackSize } from "./GridModel";
import type { GridLayoutDragStartHandler } from "./useDraggable";
import type { GridLayoutModel } from "./GridLayoutModel";
import type { GridLayoutDropPosition } from "@vuu-ui/vuu-utils";
import type { GridController } from "./GridController";
import type { GridSnapshot } from "./GridSnapshot";

export type GridLayoutActionType = "close";

export type GridLayoutCloseAction = {
  type: "close";
  id: string;
};

export type GridLayoutRenameTabAction = {
  type: "rename-tab";
  id: string;
  title: string;
};

export type GridLayoutAddTabbedChildAction = {
  title: string;
  type: "add-tabbed-child";
  componentTemplate: ComponentTemplate;
  stackId: string;
};

//TODO is it used ?
// export type GridLayoutInsertTabAction = {
//   type: "insert-tab";
//   id: string;
//   childId: string;
// };

//TODO NOT USED
export type GridLayoutSwitchTabAction = {
  type: "switch-tab";
  fromId: string;
  toId: string;
};

export type GridLayoutSelectTabAction = {
  type: "select-tab";
  itemId: string;
  stackId: string;
};

export type GridLayoutTrackAction = {
  type: "resize-grid-column" | "resize-grid-row";
  trackIndex: number;
  value: TrackSize;
};

export type GridLayoutAction =
  | GridLayoutCloseAction
  // | GridLayoutInsertTabAction
  | GridLayoutAddTabbedChildAction
  | GridLayoutSwitchTabAction
  | GridLayoutSelectTabAction
  | GridLayoutTrackAction
  | GridLayoutRenameTabAction;

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
  label: string;
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

export interface ComponentTemplate {
  /**
   * Stringified JSON - the serialized layoutJSON from which
   * component can be reconstituted
   */
  componentJson: string;
  /**
   * Can the component act as a drop target. Note: false does not
   * preclude children of the component from acting as drop targets.
   */
  dropTarget?: boolean;
  /**
   * Primarily intended for display in Palette etc.
   */
  label: string;
}

/**
 * provides details of a template, to be used on drop to instantiate  a new component
 */
export interface TemplateSource extends ComponentTemplate {
  element: HTMLElement;
  layoutId: string;
  type: "template";
}

export type DragSourceProvider = (evt: DragEvent<Element>) => DragSource;

export type DragSource =
  | ComponentDragSource
  | TemplateSource
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
): source is TemplateSource => {
  if (source === undefined) {
    throw Error("sourceIsTemplate: source is undefined");
  }
  return source.type === "template";
};

export type GridLayoutDropHandler = (
  targetId: string,
  dragSource: DragSource,
  position: GridLayoutDropPosition,
) => boolean;

export type GridLayoutDragLeaveHandler = () => void;

export interface GridLayoutContextProps {
  dispatchGridLayoutAction: GridLayoutDispatch;
  dragSourceItemId?: string;
  gridController?: GridController;
  gridLayoutModel?: GridLayoutModel;
  gridModel?: GridModel;
  gridSnapshot?: GridSnapshot;
  id: string;
  onDragEnd?: GridLayoutDragEndHandler;
  onDragLeave: GridLayoutDragLeaveHandler;
  onDragPreview: GridLayoutDropHandler;
  onDragStart: GridLayoutDragStartHandler;
  onDrop: GridLayoutDropHandler;
}

export const GridLayoutContext = createContext<GridLayoutContextProps>({
  dispatchGridLayoutAction: unconfiguredGridLayoutDispatch,
  id: "",
  onDragLeave: () => undefined,
  onDragPreview: () => false,
  onDragStart: () => console.log("no GridLayoutProvider"),
  onDrop: () => false,
});

export const useGridLayoutDispatch = () => {
  const { dispatchGridLayoutAction } = useContext(GridLayoutContext);
  return dispatchGridLayoutAction;
};

export const useGridLayoutDropHandler = () => {
  const { onDrop } = useContext(GridLayoutContext);
  return onDrop;
};

export const useGridLayoutDragPreviewHandler = () => {
  const { onDragPreview } = useContext(GridLayoutContext);
  return onDragPreview;
};

export const useGridLayoutDragLeaveHandler = () => {
  const { onDragLeave } = useContext(GridLayoutContext);
  return onDragLeave;
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

export const useGridController = () => {
  const { gridController } = useContext(GridLayoutContext);
  if (gridController) {
    return gridController;
  }
  throw Error(
    "[useGridController] no gridController, did you forget to use a GridLayout",
  );
};

export const useGridSnapshot = () => {
  const { gridSnapshot } = useContext(GridLayoutContext);
  if (gridSnapshot) {
    return gridSnapshot;
  }
  throw Error(
    "[useGridSnapshot] no gridSnapshot, did you forget to use a GridLayout",
  );
};

export const useGridLayoutId = () => {
  const { id } = useContext(GridLayoutContext);
  return id;
};

export const useGridLayoutDragSourceItemId = () => {
  const { dragSourceItemId } = useContext(GridLayoutContext);
  return dragSourceItemId;
};
