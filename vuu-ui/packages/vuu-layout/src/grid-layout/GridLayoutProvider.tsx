import {
  createContext,
  CSSProperties,
  Dispatch,
  ReactElement,
  ReactNode,
  useContext,
} from "react";

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
  version: number;
}

const GridLayoutProviderContext = createContext<GridLayoutProviderContextProps>(
  {
    dispatchGridLayoutAction: unconfiguredGridLayoutProviderDispatch,
    layoutMap: {},
    version: -1,
  }
);

export interface GridLayoutProviderProps
  extends Pick<
    GridLayoutProviderContextProps,
    "dispatchGridLayoutAction" | "layoutMap"
  > {
  children: ReactNode;
  pathToDropTarget?: string;
}

export const GridLayoutProvider = (
  props: GridLayoutProviderProps
): ReactElement => {
  const { children, dispatchGridLayoutAction, layoutMap } = props;

  return (
    <GridLayoutProviderContext.Provider
      value={{
        dispatchGridLayoutAction,
        layoutMap,
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
