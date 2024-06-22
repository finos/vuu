import {
  createContext,
  CSSProperties,
  Dispatch,
  DragEvent,
  ReactElement,
  ReactNode,
  useContext,
} from "react";
import { GridLayoutDropHandler } from "./GridPlaceholder";

export type GridStyle = Pick<
  CSSProperties,
  "gridColumnStart" | "gridColumnEnd" | "gridRowStart" | "gridRowEnd"
>;
export type GridLayoutMap = Record<string, GridStyle>;

export type GridLayoutActionType = "close";

export type GridLayoutCloseAction = {
  type: "close";
  id: string;
};

export type GridLayoutAction = GridLayoutCloseAction;

export type GridLayoutProviderDispatch = Dispatch<GridLayoutAction>;

const unconfiguredGridLayoutProviderDispatch: GridLayoutProviderDispatch = (
  action
) =>
  console.log(
    `dispatch ${action.type}, have you forgotten to provide a GridLayoutProvider ?`
  );

export type GridLayoutDragEndHandler = (evt: DragEvent<HTMLElement>) => void;

export type GridLayoutDragStartHandler = (
  evt: DragEvent<HTMLElement>,
  id: string
) => void;

export interface GridLayoutProviderContextProps {
  dispatchGridLayoutAction: GridLayoutProviderDispatch;
  layoutMap: GridLayoutMap;
  onDragEnd?: GridLayoutDragEndHandler;
  onDragStart: GridLayoutDragStartHandler;
  onDrop: GridLayoutDropHandler;
  version: number;
}

const GridLayoutProviderContext = createContext<GridLayoutProviderContextProps>(
  {
    dispatchGridLayoutAction: unconfiguredGridLayoutProviderDispatch,
    layoutMap: {},
    onDragStart: () => console.log("no GridLayoutProvider"),
    onDrop: () => console.log("no GridLayoutProvider"),
    version: -1,
  }
);

export interface GridLayoutProviderProps
  extends Pick<
    GridLayoutProviderContextProps,
    | "dispatchGridLayoutAction"
    | "layoutMap"
    | "onDragEnd"
    | "onDragStart"
    | "onDrop"
  > {
  children: ReactNode;
  pathToDropTarget?: string;
}

export const GridLayoutProvider = (
  props: GridLayoutProviderProps
): ReactElement => {
  const {
    children,
    dispatchGridLayoutAction,
    layoutMap,
    onDragEnd,
    onDragStart,
    onDrop,
  } = props;

  return (
    <GridLayoutProviderContext.Provider
      value={{
        dispatchGridLayoutAction,
        layoutMap,
        onDragEnd,
        onDragStart,
        onDrop,
        version: 0,
      }}
    >
      {children}
    </GridLayoutProviderContext.Provider>
  );
};

export const useGridLayoutProviderDispatch = () => {
  const { dispatchGridLayoutAction } = useContext(GridLayoutProviderContext);
  return dispatchGridLayoutAction;
};

export const useGridLayoutProps = (id: string) => {
  const { layoutMap } = useContext(GridLayoutProviderContext);
  return layoutMap[id];
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
