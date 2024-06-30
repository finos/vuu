import { createContext, Dispatch, ReactElement } from "react";
import {
  DragStartAction,
  LayoutReducerAction,
  QueryAction,
} from "../layout-reducer";
import { SaveAction } from "../layout-view";

const unconfiguredLayoutProviderDispatch: LayoutProviderDispatch = (action) =>
  console.log(
    `dispatch ${action.type}, have you forgotten to provide a LayoutProvider ?`
  );

export type LayoutProviderDispatch = Dispatch<
  LayoutReducerAction | SaveAction | DragStartAction | QueryAction
>;

export interface LayoutProviderContextProps {
  createNewChild?: (index?: number) => ReactElement;
  dispatchLayoutProvider: LayoutProviderDispatch;
  version: number;
}

export const LayoutProviderContext = createContext<LayoutProviderContextProps>({
  dispatchLayoutProvider: unconfiguredLayoutProviderDispatch,
  version: -1,
});
