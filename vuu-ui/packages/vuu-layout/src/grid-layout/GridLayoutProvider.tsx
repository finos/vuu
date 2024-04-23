import {
  createContext,
  CSSProperties,
  Dispatch,
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

export interface GridLayoutProviderContextProps {
  dispatchGridLayoutAction: GridLayoutProviderDispatch;
  layoutMap: GridLayoutMap;
  onDrop: GridLayoutDropHandler;
  version: number;
}

const GridLayoutProviderContext = createContext<GridLayoutProviderContextProps>(
  {
    dispatchGridLayoutAction: unconfiguredGridLayoutProviderDispatch,
    layoutMap: {},
    onDrop: () => console.log("no GridLayoutProvider"),
    version: -1,
  }
);

export interface GridLayoutProviderProps
  extends Pick<
    GridLayoutProviderContextProps,
    "dispatchGridLayoutAction" | "layoutMap" | "onDrop"
  > {
  children: ReactNode;
  pathToDropTarget?: string;
}

export const GridLayoutProvider = (
  props: GridLayoutProviderProps
): ReactElement => {
  const { children, dispatchGridLayoutAction, layoutMap, onDrop } = props;

  return (
    <GridLayoutProviderContext.Provider
      value={{
        dispatchGridLayoutAction,
        layoutMap,
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
