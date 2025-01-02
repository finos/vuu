import {
  createContext,
  Dispatch,
  DragEvent,
  ReactElement,
  ReactNode,
  useCallback,
  useContext,
} from "react";
import { GridLayoutDropHandler } from "./GridPlaceholder";
import { GridLayoutDragStartHandler } from "./useDraggable";
import { DragDropProviderNext } from "../drag-drop-next/DragDropProviderNext";
import { DropHandler } from "../drag-drop-next/DragContextNext";
import {
  GridModel,
  GridModelChildItem,
  GridModelChildItemProps,
  isFullGridChildItemStyle,
} from "./GridModel";

export type GridLayoutActionType = "close";

export type GridLayoutCloseAction = {
  type: "close";
  id: string;
};
export type GridLayoutInsertTabAction = {
  type: "insert-tab";
  id: string;
  childId: string;
};

export type GridLayoutAction =
  | GridLayoutCloseAction
  | GridLayoutInsertTabAction;

export type GridLayoutProviderDispatch = Dispatch<GridLayoutAction>;

const unconfiguredGridLayoutProviderDispatch: GridLayoutProviderDispatch = (
  action,
) =>
  console.log(
    `dispatch ${action.type}, have you forgotten to provide a GridLayoutProvider ?`,
  );

export type GridLayoutDragEndHandler = (evt: DragEvent<HTMLElement>) => void;

export interface GridLayoutProviderContextProps {
  dispatchGridLayoutAction: GridLayoutProviderDispatch;
  gridModel?: GridModel;
  onDragEnd?: GridLayoutDragEndHandler;
  onDragStart: GridLayoutDragStartHandler;
  onDrop: GridLayoutDropHandler;

  version: number;
}

const GridLayoutProviderContext = createContext<GridLayoutProviderContextProps>(
  {
    dispatchGridLayoutAction: unconfiguredGridLayoutProviderDispatch,
    onDragStart: () => console.log("no GridLayoutProvider"),
    onDrop: () => console.log("no GridLayoutProvider"),
    version: -1,
  },
);

export interface GridLayoutProviderProps
  extends Pick<
    GridLayoutProviderContextProps,
    "dispatchGridLayoutAction" | "onDragEnd" | "onDragStart" | "onDrop"
  > {
  children: ReactNode;
  gridModel: GridModel;
  pathToDropTarget?: string;
}

export const GridLayoutProvider = (
  props: GridLayoutProviderProps,
): ReactElement => {
  const {
    children,
    dispatchGridLayoutAction,
    gridModel,
    onDragEnd,
    onDragStart,
    onDrop,
  } = props;

  const handleDropNext = useCallback<DropHandler>(() => {
    console.log("handleDropNext");
  }, []);

  return (
    <GridLayoutProviderContext.Provider
      value={{
        dispatchGridLayoutAction,
        gridModel,
        onDragEnd,
        onDragStart,
        onDrop,
        version: 0,
      }}
    >
      <DragDropProviderNext dragSources={{}} onDrop={handleDropNext}>
        {children}
      </DragDropProviderNext>
    </GridLayoutProviderContext.Provider>
  );
};

export const useGridLayoutProviderDispatch = () => {
  const { dispatchGridLayoutAction } = useContext(GridLayoutProviderContext);
  return dispatchGridLayoutAction;
};

export const useGridChildProps = ({
  id,
  style,
  resizeable,
  // TODO handle resizeable etc

  // no need to store gridStyle separately, we already have it in childItem row, column
}: GridModelChildItemProps) => {
  const { gridModel } = useContext(GridLayoutProviderContext);

  const childItem = gridModel?.getChildItem(id);
  if (childItem) {
    //console.log(`already registered child item ${id}`);
  } else {
    if (isFullGridChildItemStyle(style)) {
      gridModel?.addChildItem(
        new GridModelChildItem({
          id,
          column: {
            start: style.gridColumnStart as number,
            end: style.gridColumnEnd as number,
          },
          fixed: false,
          resizeable,
          row: {
            start: style.gridRowStart as number,
            end: style.gridRowEnd as number,
          },
        }),
      );
    }
  }

  const childLayoutStyle = gridModel?.getChildItemLayout(id);
  if (childLayoutStyle) {
    return childLayoutStyle;
  } else if (isFullGridChildItemStyle(style)) {
    gridModel?.setChildItemLayout(id, style);
  } else {
    throw Error(
      `[GridLayoutProvider] no layout configuration for #${id} and missing grid layout styling`,
    );
  }
};

export const useGridLayoutDropHandler = () => {
  const { onDrop } = useContext(GridLayoutProviderContext);
  return onDrop;
};

export const useGridLayoutDragEndHandler = () => {
  const { onDragEnd } = useContext(GridLayoutProviderContext);
  return onDragEnd;
};

export const useGridLayoutDragStartHandler = () => {
  const { onDragStart } = useContext(GridLayoutProviderContext);
  return onDragStart;
};

export const useGridModel = () => {
  const { gridModel } = useContext(GridLayoutProviderContext);
  if (gridModel) {
    return gridModel;
  } else {
    throw Error(
      "[useGridModel] no gridModel, did you forget to use a GridLayout",
    );
  }
};
