import {
  createContext,
  Dispatch,
  ReactElement,
  ReactNode,
  useContext,
} from "react";

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
  version: number;
}

const GridLayoutProviderContext = createContext<GridLayoutProviderContextProps>(
  {
    dispatchGridLayoutAction: unconfiguredGridLayoutProviderDispatch,
    version: -1,
  }
);

export interface GridLayoutProviderProps
  extends Pick<GridLayoutProviderContextProps, "dispatchGridLayoutAction"> {
  children: ReactNode;
  pathToDropTarget?: string;
}

export const GridLayoutProvider = (
  props: GridLayoutProviderProps
): ReactElement => {
  const { children, dispatchGridLayoutAction } = props;

  return (
    <GridLayoutProviderContext.Provider
      value={{
        dispatchGridLayoutAction,
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
